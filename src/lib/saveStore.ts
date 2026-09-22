import { appDataSchema, APP_DATA_VERSION, type AppData } from '../schema'

/**
 * Named saves in localStorage - the in-browser answer to "download the JSON",
 * for people who do not want a folder of cv-data(3).json files.
 *
 * Each save is its own key so that writing one does not rewrite the others and
 * the list can be read without parsing every document. The index holds only
 * metadata, which is what the panel renders.
 *
 * localStorage is a single ~5MB pot shared with the live document, and one
 * avatar photo is worth a few hundred KB, so a write that would overflow it
 * prunes the oldest autosaves and retries rather than failing - a failed write
 * that goes unnoticed is how people lose work.
 */

const INDEX_KEY = 'cv-maker:saves:v1'
const SLOT_PREFIX = 'cv-maker:save:'

/** Saves kept before the oldest autosave is dropped to make room. */
export const MAX_SAVES = 10

export interface SaveMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Whether the last write was made by autosave rather than by hand. */
  auto: boolean
  /** Serialised size, for the storage read-out in the panel. */
  bytes: number
}

interface SaveIndex {
  version: 1
  activeId: string | null
  saves: SaveMeta[]
}

const EMPTY: SaveIndex = { version: 1, activeId: null, saves: [] }

function slotKey(id: string) {
  return `${SLOT_PREFIX}${id}`
}

/** UTF-16 code units, which is what browsers actually charge against quota. */
function sizeOf(text: string) {
  return text.length * 2
}

export function readIndex(): SaveIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as SaveIndex
    if (!Array.isArray(parsed?.saves)) return EMPTY
    return {
      version: 1,
      activeId: parsed.activeId ?? null,
      saves: parsed.saves,
    }
  } catch {
    return EMPTY
  }
}

function writeIndex(index: SaveIndex): boolean {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    return true
  } catch {
    return false
  }
}

export function readSave(id: string): AppData | null {
  try {
    const raw = localStorage.getItem(slotKey(id))
    if (!raw) return null
    const parsed = appDataSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export type WriteResult =
  | { ok: true; index: SaveIndex; pruned: SaveMeta[] }
  | { ok: false; error: string }

/**
 * Candidates to drop, oldest first: autosaved entries that are neither the
 * active save nor the one being written. A save you made by hand is never
 * deleted to make room - you would have no way of knowing it happened.
 */
function prunable(index: SaveIndex, keepId: string): SaveMeta[] {
  return index.saves
    .filter((s) => s.auto && s.id !== keepId && s.id !== index.activeId)
    .sort((a, b) => a.updatedAt - b.updatedAt)
}

/**
 * Write `data` into the save `id`, creating or replacing it. Returns the new
 * index plus whatever had to be dropped to fit.
 */
export function writeSave(
  id: string,
  name: string,
  data: AppData,
  { auto = false }: { auto?: boolean } = {},
): WriteResult {
  const text = JSON.stringify(data)
  let index = readIndex()
  const pruned: SaveMeta[] = []

  // Over the count cap, the oldest autosave goes before the new one lands.
  while (
    index.saves.length >= MAX_SAVES &&
    !index.saves.some((s) => s.id === id)
  ) {
    const victim = prunable(index, id)[0]
    if (!victim)
      return {
        ok: false,
        error: `Keeping ${MAX_SAVES} saves already - delete one first.`,
      }
    index = removeFromIndex(index, victim.id)
    pruned.push(victim)
  }

  for (;;) {
    try {
      localStorage.setItem(slotKey(id), text)
      break
    } catch {
      const victim = prunable(index, id)[0]
      if (!victim)
        return {
          ok: false,
          error:
            'Browser storage is full. Delete a save, or remove the photo, and try again.',
        }
      index = removeFromIndex(index, victim.id)
      pruned.push(victim)
    }
  }

  const now = Date.now()
  const existing = index.saves.find((s) => s.id === id)
  const meta: SaveMeta = {
    id,
    name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    auto,
    bytes: sizeOf(text),
  }
  const next: SaveIndex = {
    version: 1,
    activeId: id,
    saves: [meta, ...index.saves.filter((s) => s.id !== id)],
  }
  if (!writeIndex(next)) {
    localStorage.removeItem(slotKey(id))
    return {
      ok: false,
      error: 'Browser storage is full; the save was rolled back.',
    }
  }
  return { ok: true, index: next, pruned }
}

function removeFromIndex(index: SaveIndex, id: string): SaveIndex {
  localStorage.removeItem(slotKey(id))
  return {
    ...index,
    activeId: index.activeId === id ? null : index.activeId,
    saves: index.saves.filter((s) => s.id !== id),
  }
}

export function deleteSave(id: string): SaveIndex {
  const next = removeFromIndex(readIndex(), id)
  writeIndex(next)
  return next
}

export function renameSave(id: string, name: string): SaveIndex {
  const index = readIndex()
  const next: SaveIndex = {
    ...index,
    saves: index.saves.map((s) => (s.id === id ? { ...s, name } : s)),
  }
  writeIndex(next)
  return next
}

export function setActiveSave(id: string | null): SaveIndex {
  const next = { ...readIndex(), activeId: id }
  writeIndex(next)
  return next
}

/** Rough total of everything this app keeps in localStorage. */
export function storageUsed(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('cv-maker:')) continue
    total += sizeOf(localStorage.getItem(key) ?? '') + sizeOf(key)
  }
  return total
}

/** The usual per-origin localStorage budget; browsers do not expose the real one. */
export const STORAGE_BUDGET = 5 * 1024 * 1024

export function toAppData(doc: Pick<AppData, 'profile' | 'variants'>): AppData {
  return { version: APP_DATA_VERSION, ...doc }
}
