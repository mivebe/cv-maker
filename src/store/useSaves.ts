import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { newId } from '../lib/id'
import {
  deleteSave,
  readIndex,
  readSave,
  renameSave,
  setActiveSave,
  storageUsed,
  toAppData,
  writeSave,
  type SaveMeta,
} from '../lib/saveStore'
import { useStore } from './useStore'

/**
 * Named saves: one of them is active, Ctrl+S writes the document into it, and
 * autosave rewrites it on an interval. Loading one replaces the document
 * through the normal store action, so it is undoable like any other change.
 */

interface SavesState {
  saves: SaveMeta[]
  activeId: string | null
  /** The document as it was at the last save, compared by reference. */
  savedDoc: { profile: unknown; variants: unknown } | null
  notice: string | null
  error: string | null
  used: number

  refresh: () => void
  /** Write the active save, or create one named `name`. */
  save: (opts?: { name?: string; auto?: boolean }) => void
  load: (id: string) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  clearMessages: () => void
}

interface SavePrefs {
  autosave: boolean
  /** Minutes between autosaves. */
  intervalMinutes: number
  setAutosave: (on: boolean) => void
  setIntervalMinutes: (minutes: number) => void
}

/** A per-device preference, like appearance: never part of import/export. */
export const useSavePrefs = create<SavePrefs>()(
  persist(
    (set) => ({
      autosave: true,
      intervalMinutes: 5,
      setAutosave: (autosave) => set({ autosave }),
      setIntervalMinutes: (intervalMinutes) =>
        set({ intervalMinutes: Math.min(60, Math.max(1, intervalMinutes)) }),
    }),
    { name: 'cv-maker:save-prefs:v1', version: 1 },
  ),
)

export const AUTOSAVE_CHOICES = [1, 2, 5, 10, 15, 30] as const

function currentDoc() {
  const { profile, variants } = useStore.getState()
  return { profile, variants }
}

/** What an autosave calls the save it has to invent. */
function fallbackName(): string {
  const name = useStore.getState().profile.basics.name.trim()
  return name || 'Untitled CV'
}

const initial = readIndex()

export const useSaves = create<SavesState>((set, get) => ({
  saves: initial.saves,
  activeId: initial.activeId,
  // A reload keeps the live document, so nothing is pending against the last
  // save until something is actually edited in this session.
  savedDoc: currentDoc(),
  notice: null,
  error: null,
  used: storageUsed(),

  refresh: () => {
    const index = readIndex()
    set({ saves: index.saves, activeId: index.activeId, used: storageUsed() })
  },

  save: ({ name, auto = false } = {}) => {
    const { activeId, saves } = get()
    const id = name ? newId('save') : (activeId ?? newId('save'))
    const label = name ?? saves.find((s) => s.id === id)?.name ?? fallbackName()
    const doc = currentDoc()
    const result = writeSave(id, label, toAppData(doc), { auto })
    if (!result.ok) {
      set({ error: result.error, notice: null })
      return
    }
    const pruned = result.pruned.length
      ? ` Dropped ${result.pruned.length} old autosave${result.pruned.length > 1 ? 's' : ''} to make room.`
      : ''
    set({
      saves: result.index.saves,
      activeId: result.index.activeId,
      savedDoc: doc,
      used: storageUsed(),
      error: null,
      notice: `${auto ? 'Autosaved' : 'Saved'} "${label}".${pruned}`,
    })
  },

  load: (id) => {
    const data = readSave(id)
    if (!data) {
      set({ error: 'That save could not be read; it may be corrupted.' })
      return
    }
    useStore.getState().replaceAll(data)
    const index = setActiveSave(id)
    set({
      activeId: index.activeId,
      saves: index.saves,
      savedDoc: currentDoc(),
      error: null,
      notice: `Loaded "${index.saves.find((s) => s.id === id)?.name ?? ''}".`,
    })
  },

  rename: (id, name) => {
    const index = renameSave(id, name.trim() || 'Untitled')
    set({ saves: index.saves })
  },

  remove: (id) => {
    const index = deleteSave(id)
    set({
      saves: index.saves,
      activeId: index.activeId,
      used: storageUsed(),
      notice: null,
      error: null,
    })
  },

  clearMessages: () => set({ notice: null, error: null }),
}))

/** True while the document differs from what the last save holds. */
export function useUnsavedChanges(): boolean {
  const profile = useStore((s) => s.profile)
  const variants = useStore((s) => s.variants)
  const savedDoc = useSaves((s) => s.savedDoc)
  return (
    savedDoc === null ||
    savedDoc.profile !== profile ||
    savedDoc.variants !== variants
  )
}

function isDirty(): boolean {
  const { savedDoc } = useSaves.getState()
  const doc = currentDoc()
  return (
    savedDoc === null ||
    savedDoc.profile !== doc.profile ||
    savedDoc.variants !== doc.variants
  )
}

/**
 * The autosave timer. It only writes when something actually changed, so an
 * idle tab does not churn through storage, and it invents a save on first use
 * rather than quietly doing nothing when none is active yet.
 */
export function useAutosave() {
  const autosave = useSavePrefs((s) => s.autosave)
  const intervalMinutes = useSavePrefs((s) => s.intervalMinutes)

  useEffect(() => {
    if (!autosave) return
    const timer = window.setInterval(() => {
      if (!isDirty()) return
      const { activeId, save } = useSaves.getState()
      save(activeId ? { auto: true } : { name: fallbackName(), auto: true })
    }, intervalMinutes * 60_000)
    return () => window.clearInterval(timer)
  }, [autosave, intervalMinutes])
}
