import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Edits an ordered list of plain strings (bullet highlights, skill tags).
 * Operates on the whole array via onChange so callers can persist it in one
 * store update.
 */
export function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
  addLabel = 'Add',
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  const update = (i: number, v: string) =>
    onChange(values.map((x, idx) => (idx === i ? v : x)))
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= values.length) return
    const next = values.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {label && (
        <Label asChild>
          <span className="mb-1.5 block text-xs text-muted-foreground">
            {label}
          </span>
        </Label>
      )}
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              className="min-w-0 flex-1"
              value={v}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              title="Move up"
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => move(i, 1)}
              disabled={i === values.length - 1}
              aria-label="Move down"
              title="Move down"
            >
              <ChevronDown />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(i)}
              aria-label="Remove"
              title="Remove"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2"
        onClick={() => onChange([...values, ''])}
      >
        <Plus />
        {addLabel}
      </Button>
    </div>
  )
}
