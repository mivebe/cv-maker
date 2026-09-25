import { useEffect, useRef, useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  Loader2,
  LogOut,
  Paperclip,
  SendHorizontal,
  Sparkles,
  Square,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { streamingProse } from '../../lib/ai/prompt'
import { listModels, PROVIDERS, type ModelInfo } from '../../lib/ai/providers'
import {
  ATTACHMENT_LIMIT,
  useAi,
  type Attachment,
  type ChatMessage,
} from '../../store/useAi'
import { useHistory } from '../../store/useHistory'
import { useStore } from '../../store/useStore'
import { AiSetup } from './AiSetup'

/**
 * The assistant, docked to the right edge under the header. Deliberately not a
 * modal sheet like the history panel: the point is to keep editing and to watch
 * the preview change while the conversation stays open. On wide screens Layout
 * reserves its width, so the page reflows beside it instead of under it.
 */

export function AiPanelButton() {
  const open = useAi((s) => s.open)
  const setOpen = useAi((s) => s.setOpen)
  return (
    <Button
      variant={open ? 'secondary' : 'ghost'}
      size="icon"
      onClick={() => setOpen(!open)}
      aria-label="AI assistant"
      aria-pressed={open}
      title="AI assistant"
    >
      <Sparkles />
    </Button>
  )
}

const STARTERS = [
  'Tighten my experience bullets and quantify results where the facts allow',
  'Recreate my CV from the attached file',
  'Add an ATS-safe variant targeting a Senior Product Manager role',
]

/** Plain sentence of where the user is, for "this variant" to resolve. */
function useViewing(): string | undefined {
  const { pathname } = useLocation()
  const variants = useStore((s) => s.variants)
  const match = matchPath('/variant/:id', pathname)
  if (match) {
    const v = variants.find((x) => x.id === match.params.id)
    if (v)
      return `The user is editing the variant "${v.name}" (id ${v.id}); "this variant" means that one.`
  }
  if (pathname.startsWith('/variants'))
    return 'The user is on the variants list page.'
  return undefined
}

function ModelPicker() {
  const provider = useAi((s) => s.provider)
  const key = useAi((s) => (s.provider ? s.keys[s.provider] : undefined))
  const chosen = useAi((s) => (s.provider ? s.models[s.provider] : undefined))
  const setModel = useAi((s) => s.setModel)
  const [models, setModels] = useState<ModelInfo[]>([])

  useEffect(() => {
    if (!provider || !key) return
    let live = true
    listModels(provider, key)
      .then((list) => live && setModels(list))
      .catch(() => live && setModels([]))
    return () => {
      live = false
    }
  }, [provider, key])

  if (!provider) return null
  const value = chosen ?? PROVIDERS[provider].defaultModel
  // Keep the current choice selectable even before the list arrives.
  const options = models.some((m) => m.id === value)
    ? models
    : [{ id: value, label: value }, ...models]

  return (
    <Select value={value} onValueChange={setModel}>
      <SelectTrigger
        size="sm"
        className="w-full min-w-0 text-xs"
        aria-label="Model"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((m) => (
          <SelectItem key={m.id} value={m.id} className="text-xs">
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Message({ m, isLast }: { m: ChatMessage; isLast: boolean }) {
  const undo = useHistory((s) => s.undo)
  const lastIsAi = useHistory(
    (s) => s.past[s.past.length - 1]?.name === 'applyAiEdit',
  )

  if (m.role === 'user')
    return (
      <div className="ml-8 self-end rounded-lg bg-primary px-3 py-2 whitespace-pre-wrap text-primary-foreground">
        {m.text}
        {m.attachment && (
          <span className="mt-1.5 flex items-center gap-1 text-xs opacity-80">
            <Paperclip className="size-3" /> {m.attachment.name}
          </span>
        )}
      </div>
    )

  const live = m.status === 'streaming' || m.status === 'repairing'
  const { prose, writingPatch } = live
    ? streamingProse(m.text)
    : { prose: m.text, writingPatch: false }

  return (
    <div className="mr-4 flex flex-col gap-1.5">
      {prose && <div className="whitespace-pre-wrap">{prose}</div>}
      {live && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {m.status === 'repairing'
            ? 'Fixing the edit...'
            : writingPatch
              ? 'Writing changes...'
              : prose
                ? 'Writing...'
                : 'Thinking...'}
        </span>
      )}
      {m.applied && (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            Applied {m.applied.operations} change
            {m.applied.operations === 1 ? '' : 's'}
          </span>
          {isLast && lastIsAi && (
            <Button variant="ghost" size="xs" onClick={undo}>
              <Undo2 /> Undo
            </Button>
          )}
        </span>
      )}
      {m.error && (
        <span className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-2.5 py-2 text-xs whitespace-pre-wrap text-destructive">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {m.error}
        </span>
      )}
    </div>
  )
}

async function readAttachment(file: File): Promise<Attachment> {
  let text: string
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const { extractPdfText } = await import('../../lib/pdfExtract')
    text = await extractPdfText(file)
    if (!text.trim())
      throw new Error(
        'That PDF has no selectable text (it is probably a scan), so the assistant cannot read it.',
      )
  } else {
    text = await file.text()
  }
  if (text.length > ATTACHMENT_LIMIT)
    text = text.slice(0, ATTACHMENT_LIMIT) + '\n[...truncated]'
  return { name: file.name, text }
}

function Chat() {
  const messages = useAi((s) => s.messages)
  const busy = useAi((s) => s.busy)
  const send = useAi((s) => s.send)
  const stop = useAi((s) => s.stop)
  const viewing = useViewing()
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<Attachment>()
  const [attachError, setAttachError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const last = messages[messages.length - 1]
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, last?.text, last?.status])

  const submit = (text = draft) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    void send(trimmed, attachment, viewing)
    setDraft('')
    setAttachment(undefined)
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Ask for anything the editor can do. Every change is one step in
              the history, so Ctrl+Z takes it back.
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-lg border bg-background px-3 py-2 text-left text-xs hover:bg-muted"
                onClick={() => setDraft(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <Message key={m.id} m={m} isLast={i === messages.length - 1} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t p-2.5 sm:p-3">
        {(attachment || attachError) && (
          <div
            className={cn(
              'mb-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
              attachError
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Paperclip className="size-3 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {attachError ?? attachment?.name}
            </span>
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => {
                setAttachment(undefined)
                setAttachError(undefined)
              }}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Ask the assistant... (Shift+Enter for a new line)"
          className="max-h-40 min-h-16 resize-none"
          aria-label="Message the assistant"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.json,application/pdf,text/plain"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setAttachError(undefined)
              try {
                setAttachment(await readAttachment(file))
              } catch (err) {
                setAttachError((err as Error).message)
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach a PDF or text file"
            title="Attach a PDF or text file (e.g. an old CV)"
          >
            <Paperclip />
          </Button>
          <span className="ml-auto" />
          {busy ? (
            <Button size="sm" variant="secondary" onClick={stop}>
              <Square /> Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => submit()} disabled={!draft.trim()}>
              <SendHorizontal /> Send
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

export function AiPanel() {
  const open = useAi((s) => s.open)
  const setOpen = useAi((s) => s.setOpen)
  const provider = useAi((s) => s.provider)
  const connected = useAi((s) => !!(s.provider && s.keys[s.provider]))
  const hasMessages = useAi((s) => s.messages.length > 0)
  const clearChat = useAi((s) => s.clearChat)
  const disconnect = useAi((s) => s.disconnect)

  if (!open) return null

  return (
    <aside
      // `right-scroll-bar-position` is react-remove-scroll's hook: while a
      // Radix popup (the model Select) locks page scroll, the scrollbar
      // vanishes and a `right: 0` panel would jump into its gutter; the lock
      // pins elements carrying this class to where the scrollbar edge was.
      className="right-scroll-bar-position no-print fixed top-(--app-header-h) right-0 bottom-0 z-40 flex w-full flex-col border-l bg-popover text-sm text-popover-foreground shadow-lg sm:max-w-[24rem] lg:shadow-none"
      aria-label="AI assistant"
    >
      <div className="flex items-center gap-2 border-b px-3 py-2.5 sm:px-4">
        <Sparkles className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-medium">AI assistant</p>
          {provider && (
            <p className="truncate text-xs text-muted-foreground">
              via {PROVIDERS[provider].name}, free tier
            </p>
          )}
        </div>
        {connected && hasMessages && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={clearChat}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 />
          </Button>
        )}
        {connected && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={disconnect}
            aria-label="Disconnect provider"
            title="Disconnect (forget the key on this device)"
          >
            <LogOut />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
        >
          <X />
        </Button>
      </div>
      {connected ? (
        <>
          <div className="border-b px-3 py-2 sm:px-4">
            <ModelPicker />
          </div>
          <Chat />
        </>
      ) : (
        <AiSetup />
      )}
    </aside>
  )
}
