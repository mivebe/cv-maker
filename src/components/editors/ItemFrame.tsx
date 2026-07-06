import type { ReactNode } from 'react'
import { ItemControls } from '../ui'

/** Bordered container for a single list item with a title + reorder controls. */
export function ItemFrame({
  title,
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
  children,
}: {
  title: string
  onUp: () => void
  onDown: () => void
  onRemove: () => void
  disableUp: boolean
  disableDown: boolean
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-700">
          {title || <span className="text-slate-400">Untitled</span>}
        </span>
        <ItemControls
          onUp={onUp}
          onDown={onDown}
          onRemove={onRemove}
          disableUp={disableUp}
          disableDown={disableDown}
        />
      </div>
      {children}
    </div>
  )
}
