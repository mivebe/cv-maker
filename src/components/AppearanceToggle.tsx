import { useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  resolveAppearance,
  useAppearance,
  type Appearance,
} from '../store/useAppearance'

const OPTIONS: { value: Appearance; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function AppearanceToggle() {
  const mode = useAppearance((s) => s.mode)
  const setMode = useAppearance((s) => s.setMode)
  const [open, setOpen] = useState(false)

  // Show what you're looking at, not what you picked: `system` resolves to a
  // sun or a moon so the button always reflects the screen.
  const TriggerIcon = resolveAppearance(mode) === 'dark' ? Moon : Sun

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Appearance: ${mode}`}
          title="Appearance"
        >
          <TriggerIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              setOpen(false)
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
              'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
              mode === value && 'font-medium',
            )}
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            {label}
            {mode === value && <Check className="ml-auto size-4 shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
