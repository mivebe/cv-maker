import {
  CalendarDays,
  ChartPie,
  Hash,
  Languages,
  List,
  SeparatorHorizontal,
  Shapes,
  SlidersHorizontal,
  Text,
  type LucideIcon,
} from 'lucide-react'
import type { CVVariant, SectionOptions } from '../../schema'
import { useStore } from '../../store/useStore'
import { SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'

/**
 * Editors for a variant's two option-override layers. Both edit a *partial*
 * options bag, so every control is tri-state: unset ("No policy" / "No
 * override") means the layer stays silent for that key and the layer below
 * shows through.
 */

type Choice = { label: string; value: string | boolean }

interface FieldDef {
  key: keyof SectionOptions
  label: string
  /** What kind of thing this option controls, at a glance. */
  icon: LucideIcon
  choices: Choice[]
}

const ON_OFF: Choice[] = [
  { label: 'On', value: true },
  { label: 'Off', value: false },
]

const FIELDS: FieldDef[] = [
  { key: 'showIcons', label: 'Section icons', icon: Shapes, choices: ON_OFF },
  {
    key: 'rowDividers',
    label: 'Row dividers',
    icon: SeparatorHorizontal,
    choices: ON_OFF,
  },
  {
    key: 'showDescription',
    label: 'Descriptions',
    icon: Text,
    choices: ON_OFF,
  },
  { key: 'showHighlights', label: 'Highlights', icon: List, choices: ON_OFF },
  {
    key: 'datePosition',
    label: 'Date position',
    icon: CalendarDays,
    choices: [
      { label: 'Below the title', value: 'below' },
      { label: 'Right of the title', value: 'right' },
    ],
  },
  {
    key: 'chartType',
    label: 'Chart type',
    icon: ChartPie,
    choices: [
      { label: 'Pie', value: 'pie' },
      { label: 'Donut', value: 'donut' },
      { label: 'Bars (vertical)', value: 'bar' },
      { label: 'Bars (horizontal)', value: 'hbar' },
    ],
  },
  {
    key: 'chartMarker',
    label: 'Chart markers',
    icon: Hash,
    choices: [
      { label: 'Letters', value: 'letter' },
      { label: 'Numbers', value: 'number' },
      { label: 'None', value: 'none' },
    ],
  },
  {
    key: 'languageDisplay',
    label: 'Language display',
    icon: Languages,
    choices: [
      { label: 'Words', value: 'words' },
      { label: 'Notches', value: 'notches' },
      { label: 'Slider', value: 'slider' },
    ],
  },
  {
    key: 'sliderShowLabels',
    label: 'Slider labels',
    icon: SlidersHorizontal,
    choices: ON_OFF,
  },
]

/**
 * Tri-state rows over a partial options bag: a row of buttons per option,
 * like the theme editor's pickers. The inherit button reads muted when active
 * (it is the resting state - eight filled buttons would shout); a real value
 * reads filled, so a glance down the card shows exactly where this layer
 * speaks up.
 */
export function PartialOptionsFields({
  value,
  inheritLabel,
  set,
  clear,
}: {
  value: Partial<SectionOptions>
  inheritLabel: string
  set: (patch: Partial<SectionOptions>) => void
  clear: (key: keyof SectionOptions) => void
}) {
  return (
    // Multicol, not grid: the column count follows the available width and
    // the browser balances the fields' uneven heights across columns.
    <div className="columns-[16rem] gap-x-6">
      {FIELDS.map((f) => {
        const current = value[f.key]
        return (
          // Not app-ui's Field: that wraps children in a <label>, and a label
          // adopts the first button inside it as its control - clicking the
          // caption would then silently press "No policy".
          <div
            key={f.key}
            role="group"
            aria-label={f.label}
            className="mb-4 break-inside-avoid"
          >
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <f.icon className="size-3.5 shrink-0" aria-hidden />
              {f.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={current === undefined ? 'secondary' : 'outline'}
                className="h-7 px-2.5 text-xs"
                aria-pressed={current === undefined}
                onClick={() => clear(f.key)}
              >
                {inheritLabel}
              </Button>
              {f.choices.map((c) => (
                <Button
                  key={String(c.value)}
                  size="sm"
                  variant={current === c.value ? 'default' : 'outline'}
                  className="h-7 px-2.5 text-xs"
                  aria-pressed={current === c.value}
                  onClick={() => set({ [f.key]: c.value })}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * The blanket policy layer. It outranks each section's own options on purpose
 * (see resolve.ts): "no icons anywhere" must not be dodgeable per section.
 */
export function VariantOptionDefaultsCard({ variant }: { variant: CVVariant }) {
  const setVariantOptionDefaults = useStore((s) => s.setVariantOptionDefaults)
  const clearVariantOptionDefault = useStore((s) => s.clearVariantOptionDefault)
  return (
    <SectionCard
      title="Section options policy"
      description="Applied to EVERY section of this variant, over each section's own settings — how an ATS variant strips decoration in one move. Per-section escapes live in the Sections list."
    >
      <PartialOptionsFields
        value={variant.optionDefaults}
        inheritLabel="No policy"
        set={(patch) => setVariantOptionDefaults(variant.id, patch)}
        clear={(key) => clearVariantOptionDefault(variant.id, key)}
      />
    </SectionCard>
  )
}
