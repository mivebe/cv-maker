import { useEffect, useState } from 'react'
import { Redo2, RotateCw, Undo2 } from 'lucide-react'
import {
  REDO_HINT,
  selectCanRedo,
  selectCanUndo,
  UNDO_HINT,
  useHistory,
  type HistoryEntry,
} from '../../store/useHistory'
import { refsResolve } from '../../store/historyLabels'
import { useStore } from '../../store/useStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { relativeTime } from './relativeTime'

/**
 * The change log. Every entry is a button that replays that one change against
 * today's document and lands on top of the log as a new step - so a re-apply
 * is itself undoable, and nothing here is destructive.
 */

/** Relative timestamps go stale; re-render the list once a minute. */
function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])
}

function EntryRow({ entry, undone }: { entry: HistoryEntry; undone: boolean }) {
  const reapply = useHistory((s) => s.reapply)
  // Subscribing to the document keeps the enabled state honest as the items a
  // change addresses come and go underneath the panel.
  const profile = useStore((s) => s.profile)
  const variants = useStore((s) => s.variants)
  const canReapply = refsResolve({ profile, variants }, entry.refs)

  return (
    <button
      type="button"
      disabled={!canReapply}
      onClick={() => reapply(entry.id)}
      title={
        canReapply
          ? 'Apply this change again, on top of the current document'
          : 'What this change edited no longer exists'
      }
      className={cn(
        'group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left outline-none',
        'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
        'disabled:pointer-events-none disabled:opacity-40',
        undone && 'opacity-60',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{entry.title}</span>
        {entry.detail && (
          <span className="block truncate text-xs text-muted-foreground">
            {entry.detail}
          </span>
        )}
      </span>
      <span className="mt-0.5 shrink-0 text-xs text-muted-foreground tabular-nums">
        {relativeTime(entry.at)}
      </span>
      <RotateCw className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  )
}

export function HistoryTab() {
  useMinuteTick()
  const past = useHistory((s) => s.past)
  const future = useHistory((s) => s.future)
  const undo = useHistory((s) => s.undo)
  const redo = useHistory((s) => s.redo)
  const canUndo = useHistory(selectCanUndo)
  const canRedo = useHistory(selectCanRedo)

  const newestFirst = [...past].reverse()
  const undoneNewestFirst = [...future].reverse()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5 border-b px-3 py-2 sm:px-4">
        <Button
          variant="outline"
          size="sm"
          disabled={!canUndo}
          onClick={undo}
          title={`Undo (${UNDO_HINT})`}
        >
          <Undo2 />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canRedo}
          onClick={redo}
          title={`Redo (${REDO_HINT})`}
        >
          <Redo2 />
          Redo
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {past.length} step{past.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 sm:p-2">
        {past.length === 0 && future.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Nothing yet. Every edit you make shows up here, newest first.
          </p>
        ) : (
          <>
            {undoneNewestFirst.length > 0 && (
              <>
                <p className="px-2 pt-1 pb-1 text-xs font-medium text-muted-foreground">
                  Undone
                </p>
                {undoneNewestFirst.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} undone />
                ))}
                <div className="my-1.5 border-t" />
              </>
            )}
            {newestFirst.map((entry) => (
              <EntryRow key={entry.id} entry={entry} undone={false} />
            ))}
          </>
        )}
      </div>

      <p className="border-t px-3 py-2 text-xs text-muted-foreground sm:px-4">
        Click a change to apply it again. History is kept for this session only.
      </p>
    </div>
  )
}
