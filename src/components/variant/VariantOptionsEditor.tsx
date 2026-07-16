import type { CVVariant, SectionOptions } from '../../schema'
import { useStore } from '../../store/useStore'
import { Field, SectionCard } from '@/components/app-ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Editors for a variant's two option-override layers. Both edit a *partial*
 * options bag, so every control is tri-state: unset ("No override") means the
 * layer stays silent for that key and the layer below shows through.
 */

type FieldDef =
  | { key: keyof SectionOptions; label: string; type: 'bool' }
  | {
      key: keyof SectionOptions
      label: string
      type: 'enum'
      choices: { label: string; value: string }[]
    }

const FIELDS: FieldDef[] = [
  { key: 'showIcons', label: 'Section icons', type: 'bool' },
  { key: 'rowDividers', label: 'Row dividers', type: 'bool' },
  { key: 'showDescription', label: 'Descriptions', type: 'bool' },
  { key: 'showHighlights', label: 'Highlights', type: 'bool' },
  {
    key: 'datePosition',
    label: 'Date position',
    type: 'enum',
    choices: [
      { label: 'Below the title', value: 'below' },
      { label: 'Right of the title', value: 'right' },
    ],
  },
  {
    key: 'chartType',
    label: 'Chart type',
    type: 'enum',
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
    type: 'enum',
    choices: [
      { label: 'Letters', value: 'letter' },
      { label: 'Numbers', value: 'number' },
      { label: 'None', value: 'none' },
    ],
  },
  {
    key: 'languageDisplay',
    label: 'Language display',
    type: 'enum',
    choices: [
      { label: 'Words', value: 'words' },
      { label: 'Notches', value: 'notches' },
      { label: 'Slider', value: 'slider' },
    ],
  },
  { key: 'sliderShowLabels', label: 'Slider labels', type: 'bool' },
]

const INHERIT = '__inherit__'

/** Tri-state rows over a partial options bag. */
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
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((f) => {
        const current = value[f.key]
        const selectValue =
          current === undefined
            ? INHERIT
            : f.type === 'bool'
              ? String(current === true)
              : String(current)
        return (
          <Field key={f.key} label={f.label}>
            <Select
              value={selectValue}
              onValueChange={(v) => {
                if (v === INHERIT) clear(f.key)
                else if (f.type === 'bool') set({ [f.key]: v === 'true' })
                else set({ [f.key]: v })
              }}
            >
              <SelectTrigger
                className="w-full"
                data-overridden={current !== undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INHERIT}>{inheritLabel}</SelectItem>
                {f.type === 'bool' ? (
                  <>
                    <SelectItem value="true">On</SelectItem>
                    <SelectItem value="false">Off</SelectItem>
                  </>
                ) : (
                  f.choices.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
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
  const clearVariantOptionDefault = useStore(
    (s) => s.clearVariantOptionDefault,
  )
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
