import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

/**
 * App-specific composites built on the shadcn primitives in components/ui.
 * Anything generic (Button, Input, Textarea, …) is imported from there directly.
 */

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <Label asChild>
        <span className="mb-1.5 block text-xs text-muted-foreground">
          {label}
        </span>
      </Label>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-muted-foreground/70">
          {hint}
        </span>
      )}
    </label>
  )
}

/** Up/down/remove control cluster used on every list item. */
export function ItemControls({
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onUp: () => void
  onDown: () => void
  onRemove: () => void
  disableUp?: boolean
  disableDown?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onUp}
        disabled={disableUp}
        aria-label="Move up"
        title="Move up"
      >
        <ChevronUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDown}
        disabled={disableDown}
        aria-label="Move down"
        title="Move down"
      >
        <ChevronDown />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove"
        title="Remove"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
