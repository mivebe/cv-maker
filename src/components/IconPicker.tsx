import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { CVIcon, ICON_GROUPS } from '@/cv/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Picks an icon for a link / portfolio / totals row. The value is just a string,
 * so besides the shipped registry it also accepts a pasted image URL or data URL
 * (for a logo we do not ship) - which is why the search box doubles as a
 * free-text field.
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
  const groups = ICON_GROUPS.map((g) => ({
    ...g,
    names: g.names.filter((n) => !q || n.includes(q)),
  })).filter((g) => g.names.length)

  const isKnown = ICON_GROUPS.some((g) => g.names.includes(q))
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
          placeholder="Search, or paste an image URL"
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {g.label}
              </p>
              <div className="grid grid-cols-6 gap-1">
                {g.names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => pick(name)}
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md border hover:bg-accent',
                      value === name && 'ring-2 ring-primary',
                    )}
                  >
                    <CVIcon name={name} size={16} />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Anything the registry does not know still resolves - as a monogram
              if it is a name, as an <img> if it is a URL. */}
          {q && !isKnown && (
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
