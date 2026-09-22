import { useState } from 'react'
import {
  ChevronsUpDown,
  GripVertical,
  Monitor,
  Moon,
  Settings,
  Sun,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatBytes } from './history/relativeTime'
import { STORAGE_BUDGET, storageUsed } from '../lib/saveStore'
import { REDO_HINT, SAVE_HINT, UNDO_HINT } from '../store/useHistory'
import { useAppearance } from '../store/useAppearance'
import type { Appearance } from '../store/useAppearance'
import { useAvatarHistory } from '../store/useAvatarHistory'
import { useColorHistory } from '../store/useColorHistory'
import { useReorderMode, type ReorderMode } from '../store/useReorderMode'
import { AUTOSAVE_CHOICES, useSavePrefs } from '../store/useSaves'
import { useStartPage, type StartPage } from '../store/useStartPage'
import { useStore } from '../store/useStore'
import { useSuggestionsStore } from '../store/useSuggestionsStore'

/**
 * Every per-device preference in one place, behind a single gear. These
 * settings live outside the document and never ride along in import/export,
 * which is why they are not in the history panel next to the saves.
 *
 * The destructive document actions live at the bottom as labelled text rather
 * than as toolbar icons: resetting to the sample is a thing you do once, not
 * something that should sit one stray click away forever.
 */

function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  )
}

interface Choice<T> {
  value: T
  label: string
  hint?: string
  icon?: LucideIcon
}

/** Small segmented control: the options are few and mutually exclusive. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: Choice<T>[]
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-[3px]">
      {options.map(({ value: v, label, hint, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          title={hint ?? label}
          aria-pressed={value === v}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs whitespace-nowrap transition-colors',
            value === v
              ? 'bg-background font-medium text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {Icon && <Icon className="size-3.5" />}
          {label}
        </button>
      ))}
    </div>
  )
}

const APPEARANCE: Choice<Appearance>[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor, hint: 'Follow the system' },
]

const REORDER: Choice<ReorderMode>[] = [
  {
    value: 'arrows',
    label: 'Arrows',
    icon: ChevronsUpDown,
    hint: 'Move list items with up/down buttons',
  },
  {
    value: 'drag',
    label: 'Drag',
    icon: GripVertical,
    hint: 'Grab a list item anywhere outside a control and drag it',
  },
]

const START: Choice<StartPage>[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'variants', label: 'Variants' },
  { value: 'last', label: 'Last', hint: 'Whatever you had open last' },
]

const SHORTCUTS: [string, string][] = [
  ['Undo', UNDO_HINT],
  ['Redo', REDO_HINT],
  ['Save', SAVE_HINT],
]

function DangerButton({
  children,
  onClick,
  hint,
}: {
  children: React.ReactNode
  onClick: () => void
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md px-2 py-1.5 text-left outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
    >
      <span className="block text-sm text-destructive">{children}</span>
      <span className="block text-xs text-muted-foreground">{hint}</span>
    </button>
  )
}

export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const mode = useAppearance((s) => s.mode)
  const setMode = useAppearance((s) => s.setMode)
  const reorder = useReorderMode((s) => s.mode)
  const setReorder = useReorderMode((s) => s.setMode)
  const start = useStartPage((s) => s.mode)
  const setStart = useStartPage((s) => s.setMode)
  const autosave = useSavePrefs((s) => s.autosave)
  const setAutosave = useSavePrefs((s) => s.setAutosave)
  const intervalMinutes = useSavePrefs((s) => s.intervalMinutes)
  const setIntervalMinutes = useSavePrefs((s) => s.setIntervalMinutes)

  const resetToSample = useStore((s) => s.resetToSample)
  const clearAll = useStore((s) => s.clearAll)
  const suggestions = useSuggestionsStore((s) => s.user)
  const clearSuggestions = useSuggestionsStore((s) => s.clearSuggestions)
  const avatars = useAvatarHistory((s) => s.recent)
  const clearAvatars = useAvatarHistory((s) => s.clearAvatars)
  const clearColors = useColorHistory((s) => s.clearColors)

  // Recent colours always sit at a fixed length, topped up with the built-in
  // swatches, so only suggestions and photos are countable.
  const rememberedCount =
    Object.values(suggestions).reduce((n, list) => n + (list?.length ?? 0), 0) +
    avatars.length

  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings"
          title="Settings"
        >
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(34rem,calc(100vh-5rem))] w-80 overflow-y-auto p-2"
      >
        <div className="px-2">
          <Row label="Appearance">
            <Segmented value={mode} onChange={setMode} options={APPEARANCE} />
          </Row>
          <Row label="Reordering">
            <Segmented
              value={reorder}
              onChange={setReorder}
              options={REORDER}
            />
          </Row>
          <Row label="Start on" hint="Where the app opens">
            <Segmented value={start} onChange={setStart} options={START} />
          </Row>
          <Row label="Autosave" hint="Into the active save">
            <span className="flex items-center gap-1.5">
              <Checkbox
                id="settings-autosave"
                checked={autosave}
                onCheckedChange={(v) => setAutosave(v === true)}
                aria-label="Autosave"
              />
              <Select
                value={String(intervalMinutes)}
                onValueChange={(v) => setIntervalMinutes(Number(v))}
                disabled={!autosave}
              >
                <SelectTrigger size="sm" className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTOSAVE_CHOICES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </Row>
        </div>

        <div className="my-1.5 border-t" />
        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
          Shortcuts
        </p>
        <div className="px-2 pb-1">
          {SHORTCUTS.map(([label, keys]) => (
            <div
              key={label}
              className="flex items-center justify-between py-0.5 text-xs"
            >
              <span className="text-muted-foreground">{label}</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="my-1.5 border-t" />
        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
          Data
        </p>
        <DangerButton
          hint="Replaces everything with the demo CV."
          onClick={() => {
            if (confirm('Replace all current data with the built-in sample?')) {
              resetToSample()
              close()
            }
          }}
        >
          Reset to sample data…
        </DangerButton>
        <DangerButton
          hint="Empty profile, no variants."
          onClick={() => {
            if (
              confirm(
                'Delete all content and every variant? Ctrl+Z can bring it back until you reload.',
              )
            ) {
              clearAll()
              close()
            }
          }}
        >
          Clear everything…
        </DangerButton>
        <DangerButton
          hint={
            rememberedCount
              ? `${rememberedCount} entr${rememberedCount === 1 ? 'y' : 'ies'}, plus the recent colours.`
              : 'Only the recent colours so far.'
          }
          onClick={() => {
            if (!rememberedCount) return
            if (
              confirm(
                'Forget the suggestions, recent colours and recent photos this browser remembered? The CV itself is untouched.',
              )
            ) {
              clearSuggestions()
              clearAvatars()
              clearColors()
            }
          }}
        >
          Forget remembered entries…
        </DangerButton>
        <p className="px-2 pt-1 text-xs text-muted-foreground">
          {formatBytes(storageUsed())} of about {formatBytes(STORAGE_BUDGET)} of
          browser storage used.
        </p>
      </PopoverContent>
    </Popover>
  )
}
