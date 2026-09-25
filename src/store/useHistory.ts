import { useEffect } from 'react'
import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import { describeAction, type Doc } from './historyLabels'

/**
 * Undo/redo and the change log behind the history panel.
 *
 * `withHistory` wraps a store creator and records every mutation that actually
 * changes the document: the state as it was before, the action and arguments
 * that produced it, and a label built while both documents are in hand.
 * Snapshots are cheap because the actions are immutable updates - an edit to
 * one item reallocates that item and its ancestors, and everything else stays
 * shared by reference.
 *
 * History lives in memory only. The document itself is persisted (see
 * `cv-maker:v2`) and named saves go to localStorage separately, but
 * serialising a stack of snapshots alongside them would multiply the avatar
 * data URL by the stack depth and blow the ~5MB quota, which silently stops
 * the document from saving at all.
 */

/** How many steps back you can go. */
const LIMIT = 100

/** Repeats of the same action closer together than this become one step. */
const GROUP_MS = 600

/**
 * Actions whose repeats must stay separate steps: adding two items or moving
 * something twice are distinct edits even when they land in the same second.
 */
const NEVER_GROUP = /^(add|remove|delete|duplicate|move|replace|reset|clear|apply)/

export interface HistoryEntry {
  id: string
  /** The tracked slice as it was *before* the change this entry undoes. */
  snapshot: Doc
  /** Coalescing key: the action plus the target it addressed. */
  key: string
  /** The action and arguments, kept so the change can be re-applied. */
  name: string
  args: unknown[]
  /** Ids the change is addressed to; all must exist for a re-apply to bite. */
  refs: string[]
  title: string
  detail?: string
  at: number
}

interface HistoryState {
  /** Oldest first; the newest entry is the one Ctrl+Z undoes. */
  past: HistoryEntry[]
  /** Undone entries, newest last; the last one is what Ctrl+Shift+Z redoes. */
  future: HistoryEntry[]
  undo: () => void
  redo: () => void
  /** Run this change again against today's document, as a brand new step. */
  reapply: (id: string) => void
}

/** Filled in by `withHistory`; there is exactly one document store. */
let controls: Pick<HistoryState, 'undo' | 'redo' | 'reapply'> = {
  undo: () => {},
  redo: () => {},
  reapply: () => {},
}

export const useHistory = create<HistoryState>(() => ({
  past: [],
  future: [],
  undo: () => controls.undo(),
  redo: () => controls.redo(),
  reapply: (id) => controls.reapply(id),
}))

export const selectCanUndo = (s: HistoryState) => s.past.length > 0
export const selectCanRedo = (s: HistoryState) => s.future.length > 0

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** True when every tracked key still points at the same object. */
function sameSlice<S extends object>(a: S, b: S): boolean {
  return (Object.keys(a) as (keyof S)[]).every((k) => a[k] === b[k])
}

/**
 * Identify *what is being edited*, so consecutive edits to the same target can
 * merge into one undo step - typing a headline should not cost one Ctrl+Z per
 * character.
 *
 * Only the first two id-ish arguments are used: later string arguments can be
 * the edited text itself (`setOverride(variantId, itemId, field, value)`),
 * which would make the key change on every keystroke and defeat the grouping.
 * A trailing patch object contributes its keys, so editing a different field of
 * the same item still starts a new step.
 */
function actionKey(name: string, args: unknown[]): string {
  const parts: string[] = [name]
  for (const arg of args) {
    if (parts.length >= 3) break
    if (typeof arg === 'string' || typeof arg === 'number')
      parts.push(String(arg))
  }
  const last = args[args.length - 1]
  if (isPlainObject(last)) parts.push(Object.keys(last).sort().join(','))
  return parts.join('|')
}

let nextId = 0

interface HistoryOptions<T, S> {
  /** The part of the state that history tracks - the document, not the UI. */
  select: (state: T) => S
}

export function withHistory<T extends object>(
  config: StateCreator<T, [], []>,
  { select }: HistoryOptions<T, Doc>,
): StateCreator<T, [], []> {
  return (set, get, api) => {
    /** The action currently running, for grouping and for re-applying. */
    let running: { key: string; name: string; args: unknown[] } | null = null

    const recordingSet: typeof set = (partial, replace) => {
      const before = select(get())
      set(partial as never, replace as never)
      const after = select(get())
      if (sameSlice(before, after)) return

      const { key, name, args } = running ?? { key: '', name: '', args: [] }
      const at = Date.now()
      const { past, future } = useHistory.getState()
      const latest = past[past.length - 1]
      const groups =
        latest !== undefined &&
        key !== '' &&
        latest.key === key &&
        at - latest.at < GROUP_MS &&
        !NEVER_GROUP.test(name)

      const described = describeAction(
        name,
        args,
        groups ? latest.snapshot : before,
        after,
      )
      // Grouping keeps the earlier snapshot - it is the state from before the
      // first keystroke of the burst, which is where Ctrl+Z should land - but
      // takes the newest arguments, so re-applying replays the finished edit.
      const entry: HistoryEntry = {
        id: groups ? latest.id : `h${++nextId}`,
        snapshot: groups ? latest.snapshot : before,
        key,
        name,
        args,
        at,
        ...described,
      }
      const kept = groups ? past.slice(0, -1) : past.slice(-(LIMIT - 1))
      useHistory.setState({
        past: [...kept, entry],
        future: future.length ? [] : future,
      })
    }

    // `api.setState` bypasses `recordingSet`, so restoring never records. It is
    // already wrapped by `persist` at this point, so a restore is saved too.
    const restore = (snapshot: Doc) =>
      api.setState(snapshot as unknown as Partial<T>)

    controls = {
      undo: () => {
        const { past, future } = useHistory.getState()
        const entry = past[past.length - 1]
        if (!entry) return
        // The redo entry carries the state to come back to, so the snapshot it
        // stores is the *current* one, not the one the undone entry held.
        const back: HistoryEntry = { ...entry, snapshot: select(get()) }
        useHistory.setState({
          past: past.slice(0, -1),
          future: [...future, back],
        })
        restore(entry.snapshot)
      },
      redo: () => {
        const { past, future } = useHistory.getState()
        const entry = future[future.length - 1]
        if (!entry) return
        const forward: HistoryEntry = { ...entry, snapshot: select(get()) }
        useHistory.setState({
          past: [...past, forward],
          future: future.slice(0, -1),
        })
        restore(entry.snapshot)
      },
      reapply: (id) => {
        const { past, future } = useHistory.getState()
        const entry =
          past.find((e) => e.id === id) ?? future.find((e) => e.id === id)
        if (!entry) return
        const action = (get() as Record<string, unknown>)[entry.name]
        if (typeof action !== 'function') return
        // Calling the wrapped action means the replay is itself recorded, so
        // it lands on top of the log like any other edit - and is undoable.
        ;(action as (...a: unknown[]) => unknown)(...entry.args)
      },
    }

    // Wrap every action so it announces itself while it runs; that keeps the
    // document store's own code free of history bookkeeping.
    const state = config(recordingSet, get, api)
    const wrapped = { ...state } as unknown as Record<string, unknown>
    for (const [name, value] of Object.entries(wrapped)) {
      if (typeof value !== 'function') continue
      const action = value as (...args: unknown[]) => unknown
      wrapped[name] = (...args: unknown[]) => {
        const outer = running
        running = { key: actionKey(name, args), name, args }
        try {
          return action(...args)
        } finally {
          running = outer
        }
      }
    }
    return wrapped as T
  }
}

const MOD = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl+'

export const UNDO_HINT = `${MOD}Z`
export const REDO_HINT = `${MOD}⇧Z`
export const SAVE_HINT = `${MOD}S`

/** Document-wide Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y). Mounted once, in Layout. */
export function useUndoShortcut() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      // Every field here is a controlled input writing straight to the store,
      // so the browser's own undo stack cannot restore them anyway: the
      // document history handles Ctrl+Z even while a field has focus.
      e.preventDefault()
      const history = useHistory.getState()
      if (key === 'y' || e.shiftKey) history.redo()
      else history.undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
