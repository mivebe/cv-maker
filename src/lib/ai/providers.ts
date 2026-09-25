/**
 * The two free providers behind one small interface. Both are called straight
 * from the browser - there is no server - with the visitor's own credentials:
 * an OpenRouter key minted by the Connect flow (openrouterAuth.ts) or a Gemini
 * key they created in Google AI Studio. Plain `fetch` + SSE rather than SDKs:
 * two endpoints do not justify two client libraries in the bundle.
 *
 * CORS note: Gemini's preflight only admits `content-type` and
 * `x-goog-api-key`, so no extra headers may be added to its requests.
 */

export type ProviderId = 'openrouter' | 'gemini'

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface ModelInfo {
  id: string
  label: string
}

export interface ProviderInfo {
  id: ProviderId
  name: string
  /** What "free" means on this provider, shown in the setup screen. */
  quota: string
  privacy: string
  defaultModel: string
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    quota:
      'Free models only: about 50 requests a day on an account that never bought credits.',
    privacy:
      'Free models are hosted by third parties who may log prompts. Your CV text is sent to them.',
    defaultModel: 'openrouter/free',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    quota:
      'Free tier: Flash-Lite allows a few hundred requests a day, Flash about 20.',
    privacy:
      'On the free tier Google may use your prompts - including your CV text - to improve its products.',
    defaultModel: 'gemini-flash-lite-latest',
  },
}

export type AiErrorKind = 'auth' | 'quota' | 'network' | 'other'

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
  ) {
    super(message)
  }
}

const OPENROUTER = 'https://openrouter.ai/api/v1'
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta'

async function failure(provider: ProviderId, res: Response): Promise<AiError> {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error?.message ?? ''
  } catch {
    // Not JSON; the status says enough.
  }
  const name = PROVIDERS[provider].name
  if (res.status === 401 || res.status === 403)
    return new AiError(
      'auth',
      `${name} rejected the credentials. Reconnect in the assistant settings.`,
    )
  if (res.status === 429)
    return new AiError(
      'quota',
      `${name} free quota reached for now${detail ? ` (${detail})` : ''}. Wait a while, or pick another model.`,
    )
  if (res.status === 402)
    return new AiError(
      'quota',
      `${name} says this model needs credits. Pick a free model.`,
    )
  return new AiError(
    'other',
    `${name} error ${res.status}${detail ? `: ${detail}` : ''}`,
  )
}

async function request(
  provider: ProviderId,
  url: string,
  init: RequestInit,
): Promise<Response> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new AiError(
      'network',
      `Could not reach ${PROVIDERS[provider].name}. Check your connection.`,
    )
  }
  if (!res.ok) throw await failure(provider, res)
  return res
}

function openrouterHeaders(key: string): HeadersInit {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    // Attribution, shown on the user's OpenRouter activity page.
    'HTTP-Referer': location.origin + import.meta.env.BASE_URL,
    'X-Title': 'CV Maker',
  }
}

function geminiHeaders(key: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-goog-api-key': key }
}

/** Models this key can use for free, recommended one first. */
export async function listModels(
  provider: ProviderId,
  key: string,
): Promise<ModelInfo[]> {
  if (provider === 'openrouter') {
    const res = await request(provider, `${OPENROUTER}/models`, {
      headers: openrouterHeaders(key),
    })
    const body = (await res.json()) as {
      data: { id: string; name: string; context_length?: number }[]
    }
    const free = body.data
      .filter((m) => m.id.endsWith(':free'))
      // The document plus the schema is ~15k tokens; small windows cannot fit it.
      .filter((m) => (m.context_length ?? 0) >= 64000)
      .map((m) => ({ id: m.id, label: m.name.replace(/\s*\(free\)$/i, '') }))
      .sort((a, b) => a.label.localeCompare(b.label))
    return [
      { id: 'openrouter/free', label: 'Auto (best available free model)' },
      ...free,
    ]
  }

  const res = await request(provider, `${GEMINI}/models?pageSize=1000`, {
    headers: geminiHeaders(key),
  })
  const body = (await res.json()) as {
    models: {
      name: string
      displayName: string
      supportedGenerationMethods?: string[]
    }[]
  }
  const models = body.models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({ id: m.name.replace(/^models\//, ''), label: m.displayName }))
    .filter(
      (m) =>
        /^gemini-/.test(m.id) &&
        !/(embedding|tts|image|audio|live|robotics|computer-use)/.test(m.id),
    )
  // The rolling aliases first: they survive model retirements.
  const aliases: ModelInfo[] = [
    {
      id: 'gemini-flash-lite-latest',
      label: 'Flash-Lite (latest) - most free requests',
    },
    {
      id: 'gemini-flash-latest',
      label: 'Flash (latest) - smarter, fewer free requests',
    },
  ]
  const rest = models
    .filter((m) => !aliases.some((a) => a.id === m.id))
    .sort((a, b) => b.id.localeCompare(a.id))
  return [...aliases, ...rest]
}

/** Split an SSE body into its `data:` payloads. */
async function* sseData(res: Response, signal: AbortSignal) {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  try {
    while (true) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data:')) yield line.slice(5).trim()
      }
    }
    if (buffer.startsWith('data:')) yield buffer.slice(5).trim()
  } finally {
    reader.releaseLock()
  }
}

export interface StreamOptions {
  provider: ProviderId
  key: string
  model: string
  system: string
  turns: ChatTurn[]
  signal: AbortSignal
  onText: (fullTextSoFar: string) => void
}

/** Stream one reply; resolves with the complete text. */
export async function streamChat(o: StreamOptions): Promise<string> {
  let text = ''
  const push = (delta: string | undefined) => {
    if (!delta) return
    text += delta
    o.onText(text)
  }

  if (o.provider === 'openrouter') {
    const res = await request(o.provider, `${OPENROUTER}/chat/completions`, {
      method: 'POST',
      signal: o.signal,
      headers: openrouterHeaders(o.key),
      body: JSON.stringify({
        model: o.model,
        stream: true,
        messages: [
          { role: 'system', content: o.system },
          ...o.turns.map((t) => ({ role: t.role, content: t.text })),
        ],
      }),
    })
    for await (const data of sseData(res, o.signal)) {
      if (data === '[DONE]') break
      const chunk = JSON.parse(data)
      // OpenRouter reports upstream failures inside the stream.
      if (chunk.error)
        throw new AiError(
          chunk.error.code === 429 ? 'quota' : 'other',
          `OpenRouter: ${chunk.error.message ?? 'the model failed'}`,
        )
      push(chunk.choices?.[0]?.delta?.content)
    }
  } else {
    const res = await request(
      o.provider,
      `${GEMINI}/models/${encodeURIComponent(o.model)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        signal: o.signal,
        headers: geminiHeaders(o.key),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: o.system }] },
          contents: o.turns.map((t) => ({
            role: t.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: t.text }],
          })),
        }),
      },
    )
    for await (const data of sseData(res, o.signal)) {
      const chunk = JSON.parse(data)
      const parts: { text?: string; thought?: boolean }[] =
        chunk.candidates?.[0]?.content?.parts ?? []
      for (const part of parts) if (!part.thought) push(part.text)
    }
  }

  if (!text.trim())
    throw new AiError(
      'other',
      'The model returned an empty reply. Try again, or pick another model.',
    )
  return text
}
