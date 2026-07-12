import { useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS, parseDate, toCanonical } from '@/lib/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * A month/year picker that never takes the keyboard away from you: the text
 * field stays freeform (a CV needs "Present" and "Summer 2020"), and the popover
 * is an assist that writes the canonical form back into it. Day precision is
 * deliberately absent - no CV shows it.
 */
export function DateInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const parsed = parseDate(value)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(parsed?.year ?? new Date().getFullYear())

  // Re-open on the year the field currently holds, not the one last browsed.
  useEffect(() => {
    if (open && parsed) setYear(parsed.year)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const pick = (month?: number) => {
    onChange(toCanonical({ year, month }))
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        className="pr-9"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Pick a month"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
          >
            <CalendarDays />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2">
          <div className="mb-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Previous year"
              onClick={() => setYear((y) => y - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm font-medium tabular-nums">{year}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Next year"
              onClick={() => setYear((y) => y + 1)}
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => {
              const selected =
                parsed?.year === year && parsed?.month === i + 1
              return (
                <Button
                  key={m}
                  variant={selected ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs"
                  onClick={() => pick(i + 1)}
                >
                  {m.slice(0, 3)}
                </Button>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <Button variant="ghost" size="sm" onClick={() => pick()}>
              Year only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
