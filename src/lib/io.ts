import { appDataSchema, APP_DATA_VERSION, type AppData } from '../schema'

/** Serialize the current document to a pretty JSON string. */
export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

/** Trigger a browser download of the given app data as a .json file. */
export function downloadJson(data: AppData, filename = 'cv-data.json') {
  const blob = new Blob([exportJson(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export type ImportResult =
  { ok: true; data: AppData } | { ok: false; error: string }

/**
 * Parse and validate an imported JSON string against the schema. Returns a
 * typed result rather than throwing so the UI can show a readable error.
 */
export function importJson(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }

  const parsed = appDataSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first?.path.join('.') || '(root)'
    return {
      ok: false,
      error: `Schema validation failed at "${path}": ${first?.message ?? 'unknown error'}`,
    }
  }
  if (parsed.data.version !== APP_DATA_VERSION) {
    return {
      ok: false,
      error: `Unsupported data version ${parsed.data.version}.`,
    }
  }
  return { ok: true, data: parsed.data }
}
