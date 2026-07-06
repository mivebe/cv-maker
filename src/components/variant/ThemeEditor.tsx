import type { CVVariant, ThemePreset } from '../../schema'
import { useStore } from '../../store/useStore'
import { Field, SectionCard, Button } from '../ui'
import {
  THEME_PRESETS,
  THEME_PRESET_LABELS,
  themeFromPreset,
} from '../../cv/themes'

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Georgia (serif)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times (serif)', value: '"Times New Roman", Times, serif' },
  {
    label: 'Helvetica / Arial (sans)',
    value: '"Helvetica Neue", Arial, system-ui, sans-serif',
  },
  { label: 'Arial (sans, ATS-safe)', value: 'Arial, Helvetica, sans-serif' },
  {
    label: 'System UI (sans)',
    value: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  },
]

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (n: number) => void
}) {
  return (
    <Field label={`${label}: ${value}${suffix ?? ''}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </Field>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
    </Field>
  )
}

export function ThemeEditor({ variant }: { variant: CVVariant }) {
  const updateVariantTheme = useStore((s) => s.updateVariantTheme)
  const t = variant.theme
  const set = (patch: Partial<CVVariant['theme']>) =>
    updateVariantTheme(variant.id, patch)

  return (
    <SectionCard
      title="Design"
      description="Restyle this variant. The ATS-safe preset stays single-column with standard fonts for clean parsing."
    >
      <div className="space-y-4">
        <Field label="Preset">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((p) => (
              <Button
                key={p}
                variant={t.preset === p ? 'primary' : 'default'}
                onClick={() => set(themeFromPreset(p))}
              >
                {THEME_PRESET_LABELS[p]}
              </Button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Font family">
            <select
              value={t.fontFamily}
              onChange={(e) => set({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
              {!FONT_FAMILIES.some((f) => f.value === t.fontFamily) && (
                <option value={t.fontFamily}>Custom</option>
              )}
            </select>
          </Field>
          <Field label="Columns">
            <div className="flex gap-2">
              <Button
                variant={t.columns === 1 ? 'primary' : 'default'}
                onClick={() => set({ columns: 1 })}
              >
                One
              </Button>
              <Button
                variant={t.columns === 2 ? 'primary' : 'default'}
                onClick={() => set({ columns: 2 })}
              >
                Two
              </Button>
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            label="Font size"
            value={t.fontSize}
            min={8}
            max={14}
            step={0.5}
            suffix="pt"
            onChange={(fontSize) => set({ fontSize })}
          />
          <Slider
            label="Line height"
            value={t.lineHeight}
            min={1}
            max={2}
            step={0.05}
            onChange={(lineHeight) => set({ lineHeight })}
          />
          <Slider
            label="Density"
            value={t.density}
            min={0.6}
            max={1.6}
            step={0.05}
            onChange={(density) => set({ density })}
          />
          <Slider
            label="Page margin"
            value={t.pageMargin}
            min={8}
            max={30}
            step={1}
            suffix="mm"
            onChange={(pageMargin) => set({ pageMargin })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField
            label="Accent"
            value={t.accentColor}
            onChange={(accentColor) => set({ accentColor })}
          />
          <ColorField
            label="Text"
            value={t.textColor}
            onChange={(textColor) => set({ textColor })}
          />
          <ColorField
            label="Headings"
            value={t.headingColor}
            onChange={(headingColor) => set({ headingColor })}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={t.uppercaseHeadings}
              onChange={(e) => set({ uppercaseHeadings: e.target.checked })}
            />
            Uppercase section headings
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={t.headingRule}
              onChange={(e) => set({ headingRule: e.target.checked })}
            />
            Rule under headings
          </label>
        </div>
      </div>
    </SectionCard>
  )
}
