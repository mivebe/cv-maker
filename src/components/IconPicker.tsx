import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { BRAND_COUNT, CVIcon, ICON_GROUPS, searchIcons } from '@/cv/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const LIMIT = 120

/**
 * Picks an icon for a link / portfolio / totals row.
 *
 * With no query it shows a short curated set; typing searches every brand the
 * icon fork ships (~3.7k), by slug, title or alias. Results are capped - the
 * grid only draws what it shows, and each glyph it draws costs one small fetch.
 *
 * The value is just a string, so besides the registry it also accepts a pasted
 * image URL or data URL (for a logo the fork does not have) - which is why the
 * search box doubles as a free-text field.
 */
export function IconPicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (icon: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const results = useMemo(() => (q ? searchIcons(q, LIMIT + 1) : []), [q])

  const shown = results.slice(0, LIMIT)
  const truncated = results.length > LIMIT
  const isKnown = results.includes(q)

  const pick = (name: string) => {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start gap-2 font-normal', className)}
        >
          {value ? (
            <>
              <CVIcon name={value} size={14} />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No icon</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 space-y-3" align="start">
        <Input
          autoFocus
          value={query}
          placeholder={`Search ${BRAND_COUNT.toLocaleString()} icons, or paste a URL`}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {q ? (
            <>
              <div className="grid grid-cols-6 gap-1">
                {shown.map((name) => (
                  <IconCell
                    key={name}
                    name={name}
                    selected={value === name}
                    onPick={pick}
                  />
                ))}
              </div>

              {!shown.length && (
                <p className="text-xs text-muted-foreground">
                  No icon matches “{query.trim()}”.
                </p>
              )}

              {truncated && (
                <p className="text-xs text-muted-foreground">
                  Showing the first {LIMIT} matches — keep typing to narrow.
                </p>
              )}

              {/* Anything the registry does not know still resolves - as a
                  monogram if it is a name, as an <img> if it is a URL. */}
              {!isKnown && (
                <Button
                  variant="secondary"
                  className="w-full justify-start gap-2"
                  onClick={() => pick(query.trim())}
                >
                  <CVIcon name={query.trim()} size={16} />
                  <Check className="ml-auto" />
                  Use “{query.trim()}”
                </Button>
              )}
            </>
          ) : (
            ICON_GROUPS.map((g) => (
              <div key={g.label}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {g.label}
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {g.names.map((name) => (
                    <IconCell
                      key={name}
                      name={name}
                      selected={value === name}
                      onPick={pick}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {value && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => pick('')}
          >
            <X />
            Clear icon
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

function IconCell({
  name,
  selected,
  onPick,
}: {
  name: string
  selected: boolean
  onPick: (name: string) => void
}) {
  return (
    <button
      type="button"
      title={name}
      onClick={() => onPick(name)}
      className={cn(
        'flex h-9 items-center justify-center rounded-md border hover:bg-accent',
        selected && 'ring-2 ring-primary',
      )}
    >
      <CVIcon name={name} size={16} />
    </button>
  )
}
