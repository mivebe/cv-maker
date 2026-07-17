import { useState } from 'react'
import { Check, ChevronsUpDown, GripVertical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useReorderMode, type ReorderMode } from '../store/useReorderMode'

const OPTIONS: {
  value: ReorderMode
  label: string
  hint: string
  icon: LucideIcon
}[] = [
  {
    value: 'arrows',
    label: 'Arrow buttons',
    hint: 'Move list items with up/down buttons.',
    icon: ChevronsUpDown,
  },
  {
    value: 'drag',
    label: 'Drag & drop',
    hint: 'Grab a list item anywhere outside a control and drag it.',
    icon: GripVertical,
  },
]

/** Global switch between arrow-button and drag-and-drop list reordering. */
export function ReorderModeToggle() {
  const mode = useReorderMode((s) => s.mode)
  const setMode = useReorderMode((s) => s.setMode)
  const [open, setOpen] = useState(false)

  const TriggerIcon = mode === 'drag' ? GripVertical : ChevronsUpDown

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Reordering: ${mode === 'drag' ? 'drag & drop' : 'arrow buttons'}`}
          title="How lists are reordered"
        >
          <TriggerIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        {OPTIONS.map(({ value, label, hint, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none',
              'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
              mode === value && 'font-medium',
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              {label}
              <span className="block text-xs font-normal text-muted-foreground">
                {hint}
              </span>
            </span>
            {mode === value && (
              <Check className="mt-0.5 ml-auto size-4 shrink-0" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
