import type { CVVariant, ThemePreset } from '../../schema'
import { useStore } from '../../store/useStore'
import { Field, SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
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
import { Slider } from '@/components/ui/slider'
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

function SliderField({
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
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([n]) => onChange(n)}
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
          className="h-9 w-12 cursor-pointer rounded border"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24"
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
                variant={t.preset === p ? 'default' : 'outline'}
                onClick={() => set(themeFromPreset(p))}
              >
                {THEME_PRESET_LABELS[p]}
              </Button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Font family">
            <Select
              value={t.fontFamily}
              onValueChange={(fontFamily) => set({ fontFamily })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
                {/* Radix rejects an empty value, so only offer Custom for a real font. */}
                {t.fontFamily &&
                  !FONT_FAMILIES.some((f) => f.value === t.fontFamily) && (
                    <SelectItem value={t.fontFamily}>Custom</SelectItem>
                  )}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Columns">
            <div className="flex gap-2">
              <Button
                variant={t.columns === 1 ? 'default' : 'outline'}
                onClick={() => set({ columns: 1 })}
              >
                One
              </Button>
              <Button
                variant={t.columns === 2 ? 'default' : 'outline'}
                onClick={() => set({ columns: 2 })}
              >
                Two
              </Button>
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            label="Font size"
            value={t.fontSize}
            min={8}
            max={14}
            step={0.5}
            suffix="pt"
            onChange={(fontSize) => set({ fontSize })}
          />
          <SliderField
            label="Line height"
            value={t.lineHeight}
            min={1}
            max={2}
            step={0.05}
            onChange={(lineHeight) => set({ lineHeight })}
          />
          <SliderField
            label="Density"
            value={t.density}
            min={0.6}
            max={1.6}
            step={0.05}
            onChange={(density) => set({ density })}
          />
          <SliderField
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
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={t.uppercaseHeadings}
              onCheckedChange={(v) => set({ uppercaseHeadings: v === true })}
            />
            Uppercase section headings
          </Label>
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={t.headingRule}
              onCheckedChange={(v) => set({ headingRule: v === true })}
            />
            Rule under headings
          </Label>
        </div>
      </div>
    </SectionCard>
  )
}
