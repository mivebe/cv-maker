import { useId, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  DEFAULT_SUGGESTIONS,
  SUGGESTION_KIND_LABELS,
  matchSuggestions,
  poolHas,
  type Suggestion,
  type SuggestionKind,
} from '@/lib/suggestions'
import { useSuggestionsStore } from '@/store/useSuggestionsStore'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Text input with a filtered suggestion list (a combobox, in ARIA terms).
 *
 * The pool is the user's own suggestions followed by the app defaults, so a
 * user entry always outranks a default of equal match quality. Typing a value
 * that's in neither pool offers "Add to suggestions", which stores it in
 * localStorage for that kind.
 *
 * Freeform text is always allowed - the list only ever assists.
 */
export function SuggestInput({
  kind,
  value,
  onChange,
  className,
  onKeyDown,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  kind: SuggestionKind
  value: string
  onChange: (value: string) => void
}) {
  const userValues = useSuggestionsStore((s) => s.user[kind])
  const addSuggestion = useSuggestionsStore((s) => s.addSuggestion)
  const removeSuggestion = useSuggestionsStore((s) => s.removeSuggestion)

  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  /** User entries first, then defaults; duplicates collapse onto the user's. */
  const pool = useMemo<Suggestion[]>(() => {
    const seen = new Set<string>()
    const merged: Suggestion[] = []
    for (const v of userValues ?? []) {
      const key = v.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      merged.push({ value: v })
    }
    for (const s of DEFAULT_SUGGESTIONS[kind]) {
      const key = s.value.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(s)
    }
    return merged
  }, [kind, userValues])

  const isUserValue = (v: string) =>
    (userValues ?? []).some((x) => x.toLowerCase() === v.toLowerCase())

  const matches = useMemo(() => matchSuggestions(pool, value), [pool, value])

  const trimmed = value.trim()
  const canAdd = trimmed.length > 0 && !poolHas(pool, trimmed)
  /** Rows are the matches, then (optionally) the "add" row at index `matches.length`. */
  const rowCount = matches.length + (canAdd ? 1 : 0)
  const activeIndex = Math.min(active, Math.max(rowCount - 1, 0))
  const isOpen = open && rowCount > 0

  const commit = (next: string) => {
    onChange(next)
    setOpen(false)
    setActive(0)
  }

  const add = () => {
    addSuggestion(kind, trimmed)
    commit(trimmed)
  }

  const choose = (i: number) => {
    if (i < matches.length) commit(matches[i].value)
    else if (canAdd) add()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setOpen(true)
        setActive(0)
        return
      }
      const dir = e.key === 'ArrowDown' ? 1 : -1
      setActive((rowCount + activeIndex + dir) % rowCount)
      return
    }
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault()
      choose(activeIndex)
      return
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'Tab') setOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          ref={inputRef}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen ? `${listId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          className={className}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        // Focus stays in the input: the list is driven by the keyboard, and
        // rows suppress mousedown so clicking one never blurs the field.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        // The input is the anchor, not the trigger, so Radix counts clicks on
        // it as "outside". Ignore those: clicking the field you're typing in
        // shouldn't dismiss its own suggestions.
        onPointerDownOutside={(e) => {
          if (e.target === inputRef.current) e.preventDefault()
        }}
        className="max-h-64 w-(--radix-popover-trigger-width) min-w-48 overflow-y-auto p-1"
      >
        <ul id={listId} role="listbox" className="space-y-0.5">
          {matches.map((s, i) => {
            const own = isUserValue(s.value)
            return (
              <li
                key={s.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  i === activeIndex && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{s.value}</span>
                {own ? (
                  <button
                    type="button"
                    aria-label={`Remove "${s.value}" from suggestions`}
                    title="Remove from suggestions"
                    className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSuggestion(kind, s.value)
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  s.aliases?.[0] && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {s.aliases[0]}
                    </span>
                  )
                )}
              </li>
            )
          })}

          {canAdd && (
            <li
              id={`${listId}-${matches.length}`}
              role="option"
              aria-selected={activeIndex === matches.length}
              onMouseEnter={() => setActive(matches.length)}
              onClick={() => add()}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground',
                matches.length > 0 && 'mt-1 border-t pt-2',
                activeIndex === matches.length &&
                  'bg-accent text-accent-foreground',
              )}
            >
              <Plus className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">
                Add “{trimmed}” to {SUGGESTION_KIND_LABELS[kind]}
              </span>
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
