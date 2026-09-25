import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  AiError,
  PROVIDERS,
  streamChat,
  type ChatTurn,
  type ProviderId,
} from '../lib/ai/providers'
import { buildSystemPrompt, parseReply } from '../lib/ai/prompt'
import {
  checkDocument,
  fillDefaults,
  maskImages,
  unmaskImages,
  type Masked,
} from '../lib/ai/document'
import { applyPatch, asPatchOps, PatchError } from '../lib/ai/patch'
import { useStore } from './useStore'

/**
 * The assistant: which free provider the visitor connected, and the running
 * conversation. Credentials are the visitor's own and stay in this browser
 * (localStorage, per device, never in exports). The conversation is memory
 * only - the document it changed is what persists, and every change it made
 * is in the history panel.
 *
 * One message costs one request when the patch applies cleanly. A rejected
 * patch is sent back with the exact errors, at most MAX_REPAIRS times, because
 * each repair spends another request from a small daily allowance.
 */

const MAX_REPAIRS = 2
/** Earlier turns kept as context; the document itself always travels fresh. */
const HISTORY_TURNS = 12
/** Attached text beyond this is cut, to keep a request inside free limits. */
export const ATTACHMENT_LIMIT = 40_000

export interface Attachment {
  name: string
  text: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  attachment?: Attachment
  status?: 'streaming' | 'repairing' | 'done' | 'error'
  /** Set when this reply changed the document. */
  applied?: { operations: number }
  error?: string
}

interface AiState {
  provider: ProviderId | null
  keys: Partial<Record<ProviderId, string>>
  models: Partial<Record<ProviderId, string>>

  open: boolean
  messages: ChatMessage[]
  busy: boolean
  /** Shown in the setup screen: a Connect round trip that failed, etc. */
  setupError: string | null

  setOpen: (open: boolean) => void
  connect: (provider: ProviderId, key: string) => void
  disconnect: () => void
  setModel: (model: string) => void
  setSetupError: (error: string | null) => void
  send: (
    text: string,
    attachment?: Attachment,
    viewing?: string,
  ) => Promise<void>
  stop: () => void
  clearChat: () => void
}

let controller: AbortController | null = null
let nextId = 0
const mid = () => `m${Date.now()}_${++nextId}`

/** What the model sees for a user message, attachment inlined. */
function userTurnText(m: ChatMessage): string {
  if (!m.attachment) return m.text
  return `${m.text}\n\n<attached file="${m.attachment.name}">\n${m.attachment.text}\n</attached>`
}

/**
 * Earlier assistant turns lose their patch: its indexes were relative to a
 * document that no longer exists, and resending it would only mislead.
 */
function historyTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter((m) => m.status !== 'error' && m.text.trim())
    .slice(-HISTORY_TURNS)
    .map((m) => ({
      role: m.role,
      text:
        m.role === 'user'
          ? userTurnText(m)
          : m.text + (m.applied ? '\n\n[Your edit was applied.]' : ''),
    }))
}

/**
 * Join back-to-back turns of the same role (a failed reply is dropped, leaving
 * two user turns in a row), which Gemini rejects.
 */
function mergeRuns(turns: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = []
  for (const t of turns) {
    const last = out[out.length - 1]
    if (last?.role === t.role)
      out[out.length - 1] = {
        ...last,
        text: `${last.text}

${t.text}`,
      }
    else out.push({ ...t })
  }
  // Conversations must open with the user.
  while (out[0]?.role === 'assistant') out.shift()
  return out
}

export const useAi = create<AiState>()(
  persist(
    (set, get) => {
      const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, ...patch } : m,
          ),
        }))

      return {
        provider: null,
        keys: {},
        models: {},
        open: false,
        messages: [],
        busy: false,
        setupError: null,

        setOpen: (open) => set({ open }),
        connect: (provider, key) =>
          set((s) => ({
            provider,
            keys: { ...s.keys, [provider]: key },
            setupError: null,
          })),
        disconnect: () =>
          set((s) => {
            const keys = { ...s.keys }
            if (s.provider) delete keys[s.provider]
            return { provider: null, keys }
          }),
        setModel: (model) =>
          set((s) =>
            s.provider ? { models: { ...s.models, [s.provider]: model } } : {},
          ),
        setSetupError: (setupError) => set({ setupError }),

        stop: () => controller?.abort(),
        clearChat: () => {
          controller?.abort()
          set({ messages: [], busy: false })
        },

        send: async (text, attachment, viewing) => {
          const { provider, keys, models, busy } = get()
          const key = provider ? keys[provider] : undefined
          if (!provider || !key || busy) return
          const model = models[provider] ?? PROVIDERS[provider].defaultModel

          const user: ChatMessage = {
            id: mid(),
            role: 'user',
            text,
            attachment,
          }
          const reply: ChatMessage = {
            id: mid(),
            role: 'assistant',
            text: '',
            status: 'streaming',
          }
          const earlier = get().messages
          set({ messages: [...earlier, user, reply], busy: true })
          controller = new AbortController()
          const signal = controller.signal

          // Snapshot the document once: repairs must target the same one.
          const { profile, variants } = useStore.getState()
          const masked = maskImages({ version: 2, profile, variants })
          const system = buildSystemPrompt({ doc: masked.doc, viewing })
          const turns = mergeRuns([
            ...historyTurns(earlier),
            { role: 'user', text: userTurnText(user) },
          ])

          try {
            let prose = ''
            for (let attempt = 0; ; attempt++) {
              const raw = await streamChat({
                provider,
                key,
                model,
                system,
                turns,
                signal,
                onText: (full) => {
                  // A repair only ever sends a patch; keep the first prose.
                  if (attempt === 0) patchMessage(reply.id, { text: full })
                },
              })
              const parsed = parseReply(raw)
              if (attempt === 0) prose = parsed.prose
              if (!parsed.patch) {
                patchMessage(
                  reply.id,
                  attempt === 0
                    ? { text: prose, status: 'done' }
                    : {
                        text: prose,
                        status: 'error',
                        error:
                          'The model did not send a corrected edit, so nothing changed.',
                      },
                )
                return
              }

              const errors = tryApply(parsed.patch, masked, text)
              if (!errors) {
                patchMessage(reply.id, {
                  text: prose || 'Done.',
                  status: 'done',
                  applied: { operations: countOps(parsed.patch) },
                })
                return
              }
              if (attempt >= MAX_REPAIRS) {
                patchMessage(reply.id, {
                  text: prose,
                  status: 'error',
                  error: `The edit could not be applied, so nothing changed:\n${errors.join('\n')}`,
                })
                return
              }
              patchMessage(reply.id, { text: prose, status: 'repairing' })
              turns.push(
                { role: 'assistant', text: raw },
                {
                  role: 'user',
                  text: `Your patch was NOT applied - the document is unchanged. Problems:\n${errors
                    .map((e) => `- ${e}`)
                    .join(
                      '\n',
                    )}\n\nReply with only a corrected \`cv-patch\` block against the same CURRENT DOCUMENT.`,
                },
              )
            }
          } catch (err) {
            const aborted =
              err instanceof DOMException && err.name === 'AbortError'
            const current = get().messages.find((m) => m.id === reply.id)
            patchMessage(reply.id, {
              status: aborted ? 'done' : 'error',
              text: parseReply(current?.text ?? '').prose,
              error: aborted
                ? current?.text
                  ? undefined
                  : 'Stopped.'
                : err instanceof AiError || err instanceof Error
                  ? err.message
                  : 'Something went wrong.',
            })
          } finally {
            controller = null
            set({ busy: false })
          }
        },
      }
    },
    {
      name: 'cv-maker:ai',
      partialize: (s) => ({
        provider: s.provider,
        keys: s.keys,
        models: s.models,
      }),
    },
  ),
)

function countOps(patch: string): number {
  try {
    const v = JSON.parse(patch)
    return Array.isArray(v) ? v.length : 1
  } catch {
    return 0
  }
}

/** Apply a patch and commit it; returns the problems, or null on success. */
function tryApply(
  patchText: string,
  { doc, images }: Masked,
  request: string,
): string[] | null {
  let ops
  try {
    ops = asPatchOps(JSON.parse(patchText))
  } catch (err) {
    return [
      err instanceof PatchError
        ? err.message
        : `the cv-patch block is not valid JSON (${(err as Error).message})`,
    ]
  }
  // Against the snapshot the model was shown: its indexes refer to that one.
  let next: unknown
  try {
    next = applyPatch(doc, ops)
  } catch (err) {
    return [(err as Error).message]
  }
  const checked = checkDocument(unmaskImages(fillDefaults(next), images))
  if (!checked.ok) return checked.errors
  useStore.getState().applyAiEdit(checked.data, request)
  return null
}
