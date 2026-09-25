import type { LanguageInfo } from '../i18n'
import type { TValue } from '../translate'
import { AiError, streamChat, type ProviderId } from './providers'

/**
 * One-shot translation, separate from the chat assistant: no conversation and
 * no JSON Patch. The model gets a flat `{ key: text }` object and returns the
 * same keys translated, which lib/translate then writes into the variant.
 *
 * Text is sent in batches so a long CV fits a free model's output limit.
 * Each batch costs one request from the visitor's daily allowance.
 */

export interface AiCredentials {
  provider: ProviderId
  key: string
  model: string
}

/** Source characters per request. Cyrillic output runs about 2-3x the tokens. */
const BATCH_CHARS = 6000

function system(lang: LanguageInfo): string {
  return `You translate CV (résumé) text into ${lang.name} (${lang.native}).

You receive a JSON object. Reply with ONLY a JSON object that has exactly the same keys, each value translated. No prose, no code fence.

Rules:
- A string stays a string; an array stays an array of strings with the same length and order.
- Use the natural, professional wording a native ${lang.name} CV would use; do not translate word for word.
- Keep company names, product and technology names (React, AWS, PostgreSQL), URLs, e-mail addresses, numbers and units unchanged.
- The key "basics:name" is the person's name: give its standard transliteration in the ${lang.name} writing system (e.g. Cyrillic for Bulgarian or Russian). If the name is already in that script, keep it.
- Keep markdown markers such as **bold** around the corresponding translated words.
- If a value is already in ${lang.name}, return it unchanged.`
}

/** Split into batches of roughly BATCH_CHARS, never splitting one entry. */
function batches(entries: [string, TValue][]): Record<string, TValue>[] {
  const out: Record<string, TValue>[] = []
  let current: Record<string, TValue> = {}
  let size = 0
  for (const [key, value] of entries) {
    const len = JSON.stringify(value).length
    if (size > 0 && size + len > BATCH_CHARS) {
      out.push(current)
      current = {}
      size = 0
    }
    current[key] = value
    size += len
  }
  if (size > 0) out.push(current)
  return out
}

/** Pull the JSON object out of a reply, tolerating a stray fence or preface. */
function parseObject(text: string): Record<string, unknown> {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start)
    throw new AiError('other', 'The model did not return a translation.')
  try {
    const value = JSON.parse(text.slice(start, end + 1))
    if (typeof value === 'object' && value !== null && !Array.isArray(value))
      return value as Record<string, unknown>
  } catch {
    // Fall through to the error below.
  }
  throw new AiError('other', 'The model returned malformed JSON. Try again.')
}

/** Keep only answers shaped like their source; the rest stay untranslated. */
function accept(
  source: Record<string, TValue>,
  reply: Record<string, unknown>,
): Record<string, TValue> {
  const out: Record<string, TValue> = {}
  for (const [key, src] of Object.entries(source)) {
    const v = reply[key]
    if (typeof src === 'string') {
      if (typeof v === 'string' && v.trim()) out[key] = v
    } else if (
      Array.isArray(v) &&
      v.length === src.length &&
      v.every((s) => typeof s === 'string')
    ) {
      out[key] = v as string[]
    }
  }
  return out
}

export interface TranslateProgress {
  done: number
  total: number
}

/**
 * Translate `source` into `lang`. Resolves with whatever came back well
 * formed; a key missing from the result simply stays untranslated.
 */
export async function translateTexts(
  creds: AiCredentials,
  lang: LanguageInfo,
  source: Record<string, TValue>,
  signal: AbortSignal,
  onProgress?: (p: TranslateProgress) => void,
): Promise<Record<string, TValue>> {
  const parts = batches(Object.entries(source))
  const result: Record<string, TValue> = {}
  onProgress?.({ done: 0, total: parts.length })
  for (let i = 0; i < parts.length; i++) {
    const raw = await streamChat({
      ...creds,
      system: system(lang),
      turns: [{ role: 'user', text: JSON.stringify(parts[i], null, 1) }],
      signal,
      onText: () => {},
    })
    Object.assign(result, accept(parts[i], parseObject(raw)))
    onProgress?.({ done: i + 1, total: parts.length })
  }
  if (Object.keys(source).length && !Object.keys(result).length)
    throw new AiError('other', 'The model did not return a usable translation.')
  return result
}
