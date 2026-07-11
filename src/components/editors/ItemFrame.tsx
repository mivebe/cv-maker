import type { ReactNode } from 'react'
import { ItemControls } from '@/components/app-ui'

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
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">
          {title || <span className="text-muted-foreground">Untitled</span>}
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
