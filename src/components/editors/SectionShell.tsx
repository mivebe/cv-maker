import { useState, type ReactNode } from 'react'
import { Settings2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Section, SectionOptions } from '../../schema'
import { effectiveOptions } from '../../lib/sections'
import { Field, ItemControls, SliderField } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * The frame every section editor card shares: an editable heading, reorder /
 * remove controls, and a "Settings" disclosure bound to the section's options
 * bag. The per-kind editor body (the items) renders as children.
 */
export function SectionEditorCard({
  section,
  index,
  total,
  action,
  children,
}: {
  section: Section
  index: number
  total: number
  action?: ReactNode
  children: ReactNode
}) {
  const updateSection = useStore((s) => s.updateSection)
  const removeSection = useStore((s) => s.removeSection)
  const moveSection = useStore((s) => s.moveSection)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Input
            className="min-w-0 flex-1 font-medium"
            value={section.title}
            placeholder="Section title"
            onChange={(e) =>
              updateSection(section.id, { title: e.target.value })
            }
          />
          <Button
            variant={showSettings ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label="Section settings"
            title="Section settings"
            onClick={() => setShowSettings((s) => !s)}
          >
            <Settings2 />
          </Button>
          {/* Section cards flow in a masonry, not a vertical list, so they are
              not draggable - the arrows stay in both reorder modes. */}
          <ItemControls
            forceArrows
            onUp={() => moveSection(section.id, 'up')}
            onDown={() => moveSection(section.id, 'down')}
            onRemove={() => removeSection(section.id)}
            disableUp={index === 0}
            disableDown={index === total - 1}
          />
        </div>
      </CardHeader>
      <CardContent>
        {showSettings && (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-3">
            <Field label="Subtitle" hint="Small line under the section title.">
              <Input
                value={section.subtitle}
                onChange={(e) =>
                  updateSection(section.id, { subtitle: e.target.value })
                }
              />
            </Field>
            <SectionOptionsFields section={section} />
          </div>
        )}
        {children}
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  )
}

function OptToggle({
  label,
  section,
  name,
}: {
  label: string
  section: Section
  name: keyof SectionOptions
}) {
  const updateSectionOptions = useStore((s) => s.updateSectionOptions)
  const checked = effectiveOptions(section)[name] as boolean
  return (
    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) =>
          updateSectionOptions(section.id, { [name]: v === true })
        }
      />
      {label}
    </Label>
  )
}

function OptSelect<K extends keyof SectionOptions>({
  label,
  section,
  name,
  choices,
}: {
  label: string
  section: Section
  name: K
  choices: { label: string; value: SectionOptions[K] & string }[]
}) {
  const updateSectionOptions = useStore((s) => s.updateSectionOptions)
  const value = effectiveOptions(section)[name] as string
  return (
    <Field label={label}>
      <Select
        value={value}
        onValueChange={(v) => updateSectionOptions(section.id, { [name]: v })}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function OptColumns({ section, max = 4 }: { section: Section; max?: number }) {
  const updateSectionOptions = useStore((s) => s.updateSectionOptions)
  const value = effectiveOptions(section).columns
  return (
    <Field label="Columns" hint="Lay short entries side by side.">
      <Select
        value={String(value)}
        onValueChange={(v) =>
          updateSectionOptions(section.id, { columns: Number(v) })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n === 1 ? '1 (stacked)' : `${n} per row`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

const DATE_POSITIONS = [
  { label: 'Below the title', value: 'below' as const },
  { label: 'Right of the title', value: 'right' as const },
]

/**
 * Only the options the kind actually reads. Everything else in the bag is
 * inert for this kind and would just be noise here.
 */
function SectionOptionsFields({ section }: { section: Section }) {
  const kind = section.kind
  const opts = effectiveOptions(section)
  const updateSectionOptions = useStore((s) => s.updateSectionOptions)

  if (kind === 'banner' || kind === 'skills') return null

  return (
    <div className="space-y-3">
      {(kind === 'experience' ||
        kind === 'education' ||
        kind === 'projects' ||
        kind === 'items') && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <OptToggle
              label="Show description"
              section={section}
              name="showDescription"
            />
            {kind !== 'education' && (
              <OptToggle
                label="Show highlights"
                section={section}
                name="showHighlights"
              />
            )}
            <OptToggle
              label="Row dividers"
              section={section}
              name="rowDividers"
            />
            <OptToggle label="Show icons" section={section} name="showIcons" />
          </div>
          {kind !== 'projects' && (
            <OptSelect
              label="Date position"
              section={section}
              name="datePosition"
              choices={DATE_POSITIONS}
            />
          )}
          {kind === 'items' && <OptColumns section={section} />}
        </>
      )}

      {kind === 'totals' && (
        <>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <OptToggle
              label="Column dividers"
              section={section}
              name="rowDividers"
            />
            <OptToggle label="Show icons" section={section} name="showIcons" />
          </div>
          <OptColumns section={section} max={6} />
        </>
      )}

      {kind === 'chart' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <OptSelect
              label="Chart type"
              section={section}
              name="chartType"
              choices={[
                { label: 'Pie', value: 'pie' },
                { label: 'Donut', value: 'donut' },
                { label: 'Bars (vertical)', value: 'bar' },
                { label: 'Bars (horizontal)', value: 'hbar' },
              ]}
            />
            <OptSelect
              label="Markers"
              section={section}
              name="chartMarker"
              choices={[
                { label: 'Letters (A, B, C)', value: 'letter' },
                { label: 'Numbers (1, 2, 3)', value: 'number' },
                { label: 'None', value: 'none' },
              ]}
            />
            <OptSelect
              label="Colors"
              section={section}
              name="chartPalette"
              choices={[
                { label: 'From the accent color', value: 'accent' },
                { label: 'Categorical', value: 'categorical' },
              ]}
            />
            <OptSelect
              label="Value format"
              section={section}
              name="chartValueFormat"
              choices={[
                {
                  label: 'Auto (percent for pie/donut, raw for bars)',
                  value: 'auto',
                },
                { label: 'Percent of total', value: 'percent' },
                { label: 'Raw value', value: 'raw' },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <OptToggle
              label="Show values"
              section={section}
              name="chartShowValue"
            />
            <OptToggle label="Show icons" section={section} name="showIcons" />
          </div>
        </>
      )}

      {kind === 'sliders' && (
        <>
          <SliderField
            label="Steps"
            value={opts.sliderSteps}
            min={2}
            max={10}
            step={1}
            onChange={(sliderSteps) =>
              updateSectionOptions(section.id, { sliderSteps })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start label">
              <Input
                value={opts.sliderStartLabel}
                placeholder="Novice"
                onChange={(e) =>
                  updateSectionOptions(section.id, {
                    sliderStartLabel: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="End label">
              <Input
                value={opts.sliderEndLabel}
                placeholder="Expert"
                onChange={(e) =>
                  updateSectionOptions(section.id, {
                    sliderEndLabel: e.target.value,
                  })
                }
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <OptToggle
              label="Show labels"
              section={section}
              name="sliderShowLabels"
            />
            <OptToggle
              label="Row dividers"
              section={section}
              name="rowDividers"
            />
          </div>
        </>
      )}

      {kind === 'titleList' && (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <OptToggle
            label="Show subtitles"
            section={section}
            name="showSubtitle"
          />
          <OptToggle label="Show icons" section={section} name="showIcons" />
          <OptToggle
            label="Row dividers"
            section={section}
            name="rowDividers"
          />
        </div>
      )}

      {kind === 'languages' && (
        <>
          <OptSelect
            label="Display"
            section={section}
            name="languageDisplay"
            choices={[
              { label: 'Words ("Professional")', value: 'words' },
              { label: 'Notches', value: 'notches' },
              { label: 'Slider', value: 'slider' },
            ]}
          />
          {opts.languageDisplay === 'slider' && (
            <OptToggle
              label="Show stage labels"
              section={section}
              name="languageShowLabels"
            />
          )}
        </>
      )}
    </div>
  )
}
