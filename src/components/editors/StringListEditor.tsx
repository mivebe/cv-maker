import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { SuggestInput } from '@/components/SuggestInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReorderMode } from '@/store/useReorderMode'
import type { SuggestionKind } from '@/lib/suggestions'

/**
 * Edits an ordered list of plain strings (bullet highlights, skill tags).
 * Operates on the whole array via onChange so callers can persist it in one
 * store update.
 *
 * Pass `suggestionKind` for lists with a controlled vocabulary (skills); rows
 * then autocomplete. Freeform lists (highlights) leave it off.
 *
 * The strings carry no identity, so the rows get locally generated stable keys
 * - that is what lets drag & drop and the reorder animation track a row across
 * moves. Every mutation goes through this component, so the keys only need
 * regenerating when the array changes shape under us (an external reset).
 */
export function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
  addLabel = 'Add',
  suggestionKind,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
  suggestionKind?: SuggestionKind
}) {
  const mode = useReorderMode((s) => s.mode)
  const nextKey = useRef(0)
  const [keys, setKeys] = useState<string[]>(() =>
    values.map(() => `r${nextKey.current++}`),
  )
  // Derived-state reset: the parent changed the array shape without us
  // (import, variant switch). Fresh keys, no animation - it is a new list.
  if (keys.length !== values.length) {
    setKeys(values.map(() => `r${nextKey.current++}`))
  }

  const update = (i: number, v: string) =>
    onChange(values.map((x, idx) => (idx === i ? v : x)))
  const remove = (i: number) => {
    setKeys(keys.filter((_, idx) => idx !== i))
    onChange(values.filter((_, idx) => idx !== i))
  }
  const add = () => {
    setKeys([...keys, `r${nextKey.current++}`])
    onChange([...values, ''])
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= values.length) return
    const nextKeys = keys.slice()
    ;[nextKeys[i], nextKeys[j]] = [nextKeys[j], nextKeys[i]]
    setKeys(nextKeys)
    const next = values.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const reorder = (newKeys: string[]) => {
    const byKey = new Map(keys.map((k, i) => [k, values[i]]))
    setKeys(newKeys)
    onChange(newKeys.map((k) => byKey.get(k) ?? ''))
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
      <SortableList ids={keys} onReorder={reorder} className="space-y-2">
        {values.map((v, i) => (
          <SortableItem key={keys[i]} id={keys[i]}>
            <div className="flex items-center gap-1">
              {suggestionKind ? (
                <SuggestInput
                  kind={suggestionKind}
                  className="min-w-0 flex-1"
                  value={v}
                  placeholder={placeholder}
                  onChange={(next) => update(i, next)}
                />
              ) : (
                <Input
                  className="min-w-0 flex-1"
                  value={v}
                  placeholder={placeholder}
                  onChange={(e) => update(i, e.target.value)}
                />
              )}
              {mode === 'arrows' && (
                <>
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
                </>
              )}
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
          </SortableItem>
        ))}
      </SortableList>
      <Button variant="ghost" size="sm" className="mt-2" onClick={add}>
        <Plus />
        {addLabel}
      </Button>
    </div>
  )
}
