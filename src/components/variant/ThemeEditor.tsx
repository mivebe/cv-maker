import type {
  AvatarShape,
  BulletStyle,
  CVVariant,
  ThemePreset,
} from '../../schema'
import { useStore } from '../../store/useStore'
import { useColorHistory } from '../../store/useColorHistory'
import { Field, SectionCard, SliderField } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DATE_FORMATS,
  DATE_FORMAT_LABELS,
  type DateFormat,
} from '../../lib/dates'
import {
  PRESET_OPTION_DEFAULTS,
  THEME_PRESETS,
  THEME_PRESET_LABELS,
  themeFromPreset,
} from '../../cv/themes'

const FONT_FAMILIES: { label: string; value: string }[] = [
  { label: 'Georgia (serif)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times (serif)', value: '"Times New Roman", Times, serif' },
  {
    label: 'Geist (sans)',
    value: '"Geist Variable", "Helvetica Neue", Arial, system-ui, sans-serif',
  },
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

const AVATAR_SHAPES: { label: string; value: AvatarShape }[] = [
  { label: 'Rounded', value: 'rounded' },
  { label: 'Circle', value: 'circle' },
  { label: 'Squircle', value: 'squircle' },
  { label: 'Sharp corners', value: 'square' },
  { label: 'Arch', value: 'arch' },
  { label: 'Blob', value: 'blob' },
  { label: 'Cut-out (no frame)', value: 'none' },
]

/** `marker` previews the glyph cv.css draws for each choice. */
const BULLET_STYLES: { label: string; value: BulletStyle; marker: string }[] = [
  { label: 'Dot', value: 'disc', marker: '•' },
  { label: 'Ring', value: 'circle', marker: '◦' },
  { label: 'Square', value: 'square', marker: '▪' },
  { label: 'Dash', value: 'dash', marker: '–' },
  { label: 'Arrow', value: 'arrow', marker: '→' },
  { label: 'Chevron', value: 'chevron', marker: '›' },
  { label: 'Check', value: 'check', marker: '✓' },
  { label: 'None', value: 'none', marker: ' ' },
]

/** Frame proportion, width ÷ height — the shape's corner cut is separate. */
const AVATAR_RATIOS: { label: string; value: number }[] = [
  { label: 'Square 1:1', value: 1 },
  { label: 'Portrait 3:4', value: 0.75 },
  { label: 'Portrait 2:3', value: 0.667 },
  { label: 'Landscape 4:3', value: 1.333 },
]

function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const recent = useColorHistory((s) => s.recent)
  const rememberColor = useColorHistory((s) => s.rememberColor)

  // The picker streams a color per drag step; only the one left behind counts.
  const remember = () => rememberColor(value)

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          onBlur={remember}
          className="h-9 w-12 cursor-pointer rounded border"
        />
        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={remember}
          className="w-24"
        />
      </div>
      <div className="mt-2 flex gap-1.5">
        {recent.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Use ${c}`}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className="h-5 w-5 cursor-pointer rounded-sm border transition-transform hover:scale-110"
          />
        ))}
      </div>
    </Field>
  )
}

/** A row of mutually exclusive buttons - cheaper to scan than a Select. */
function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button
            key={String(o.value)}
            variant={value === o.value ? 'default' : 'outline'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </Field>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      {label}
    </Label>
  )
}

export function ThemeEditor({ variant }: { variant: CVVariant }) {
  const updateVariantTheme = useStore((s) => s.updateVariantTheme)
  const replaceVariantOptionDefaults = useStore(
    (s) => s.replaceVariantOptionDefaults,
  )
  const hasPhoto = useStore((s) => Boolean(s.profile.basics.photo))
  const hasBranding = useStore((s) => s.profile.branding.enabled)
  const t = variant.theme
  const set = (patch: Partial<CVVariant['theme']>) =>
    updateVariantTheme(variant.id, patch)

  return (
    <SectionCard
      title="Design"
      description="Restyle this variant. The ATS-safe preset stays single-column with standard fonts, no icons and no photo, for clean parsing."
    >
      <div className="space-y-4">
        <Field
          label="Preset"
          hint="Picking a preset resets the theme AND the section options policy below — ATS strips per-section decoration (icons, chart markers, language notches) so every section degrades to parseable text at once."
        >
          <div className="flex flex-wrap gap-2">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((p) => (
              <Button
                key={p}
                variant={t.preset === p ? 'default' : 'outline'}
                onClick={() => {
                  set(themeFromPreset(p))
                  replaceVariantOptionDefaults(
                    variant.id,
                    PRESET_OPTION_DEFAULTS[p],
                  )
                }}
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
          <Choice
            label="Columns"
            value={t.columns}
            options={[
              { label: 'One', value: 1 as const },
              { label: 'Two', value: 2 as const },
            ]}
            onChange={(columns) => set({ columns })}
          />
          <Field
            label="Date format"
            hint="Text the date parser doesn't recognise (“Present”, “Summer 2020”) prints as typed."
          >
            <Select
              value={t.dateFormat}
              onValueChange={(v) => set({ dateFormat: v as DateFormat })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {DATE_FORMAT_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            label="Page margin"
            value={t.pageMargin}
            min={8}
            max={30}
            step={1}
            suffix="mm"
            onChange={(pageMargin) => set({ pageMargin })}
          />
          <SliderField
            label="Density"
            value={t.density}
            min={0.6}
            max={1.6}
            step={0.05}
            onChange={(density) => set({ density })}
          />
        </div>

        <Separator />

        {/* ---- spacing ---- */}
        <p className="text-xs font-medium text-muted-foreground">Spacing</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            label="Between sections"
            value={t.sectionGap}
            min={6}
            max={40}
            step={1}
            suffix="px"
            onChange={(sectionGap) => set({ sectionGap })}
          />
          <SliderField
            label="Between items"
            value={t.itemGap}
            min={4}
            max={30}
            step={1}
            suffix="px"
            onChange={(itemGap) => set({ itemGap })}
          />
          {t.columns === 2 && (
            <>
              <SliderField
                label="Column gap"
                value={t.columnGap}
                min={8}
                max={60}
                step={1}
                suffix="px"
                onChange={(columnGap) => set({ columnGap })}
              />
              <SliderField
                label="Side column width"
                value={t.sideColumnRatio}
                min={0.3}
                max={1.2}
                step={0.02}
                suffix="× main"
                onChange={(sideColumnRatio) => set({ sideColumnRatio })}
              />
            </>
          )}
        </div>

        <Separator />

        {/* ---- header & avatar ---- */}
        <p className="text-xs font-medium text-muted-foreground">
          Header & avatar
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            label="Header alignment"
            value={t.headerAlign}
            options={[
              { label: 'Left', value: 'left' as const },
              { label: 'Centered', value: 'center' as const },
            ]}
            onChange={(headerAlign) => set({ headerAlign })}
          />
          <Choice
            label="Avatar side"
            value={t.avatarPosition}
            options={[
              { label: 'Right', value: 'right' as const },
              { label: 'Left', value: 'left' as const },
            ]}
            onChange={(avatarPosition) => set({ avatarPosition })}
          />
          <Choice
            label="Under the name"
            value={t.headerFill ?? ('none' as const)}
            options={[
              { label: 'Empty', value: 'none' as const },
              { label: 'Profile links', value: 'links' as const },
              { label: 'Summary', value: 'summary' as const },
            ]}
            onChange={(headerFill) => set({ headerFill })}
          />
        </div>

        <Toggle
          label="Show avatar"
          checked={t.showAvatar}
          onChange={(showAvatar) => set({ showAvatar })}
        />
        {t.showAvatar && !hasPhoto && (
          <p className="text-xs text-muted-foreground/70">
            No photo on the master profile yet — add one in Profile → Basics.
          </p>
        )}

        {t.showAvatar && (
          <>
            <Field label="Shape">
              <div className="flex flex-wrap gap-2">
                {AVATAR_SHAPES.map((s) => (
                  <Button
                    key={s.value}
                    variant={t.avatarShape === s.value ? 'default' : 'outline'}
                    onClick={() => set({ avatarShape: s.value })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </Field>

            {/* A cut-out has no frame, so its proportions come from the image. */}
            {t.avatarShape !== 'none' && (
              <Choice
                label="Frame"
                value={t.avatarRatio}
                options={AVATAR_RATIOS}
                onChange={(avatarRatio) => set({ avatarRatio })}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Width"
                value={t.avatarSize}
                min={16}
                max={55}
                step={1}
                suffix="mm"
                onChange={(avatarSize) => set({ avatarSize })}
              />
              <SliderField
                label="Zoom"
                value={t.avatarZoom}
                min={1}
                max={2.5}
                step={0.05}
                suffix="×"
                onChange={(avatarZoom) => set({ avatarZoom })}
              />
              <SliderField
                label="Framing — horizontal"
                value={t.avatarOffsetX}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(avatarOffsetX) => set({ avatarOffsetX })}
              />
              <SliderField
                label="Framing — vertical"
                value={t.avatarOffsetY}
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={(avatarOffsetY) => set({ avatarOffsetY })}
              />
              <SliderField
                label="Ring"
                value={t.avatarRing}
                min={0}
                max={8}
                step={1}
                suffix="px"
                onChange={(avatarRing) => set({ avatarRing })}
              />
              {t.avatarRing > 0 && (
                <ColorField
                  label="Ring color"
                  value={t.avatarRingColor}
                  onChange={(avatarRingColor) => set({ avatarRingColor })}
                />
              )}
              {/* A cut-out portrait (transparent PNG) usually wants a plate behind it. */}
              <ColorField
                label="Backdrop"
                value={t.avatarBackdrop}
                placeholder="none"
                onChange={(avatarBackdrop) => set({ avatarBackdrop })}
              />
            </div>

            <Toggle
              label="Grayscale photo"
              checked={t.avatarGrayscale}
              onChange={(avatarGrayscale) => set({ avatarGrayscale })}
            />
          </>
        )}

        <Separator />

        {/* ---- color ---- */}
        <p className="text-xs font-medium text-muted-foreground">Color</p>
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
          <ColorField
            label="Item titles"
            value={t.titleColor}
            placeholder="accent"
            onChange={(titleColor) => set({ titleColor })}
          />
          <ColorField
            label="Links"
            value={t.linkColor}
            placeholder="accent"
            onChange={(linkColor) => set({ linkColor })}
          />
          <ColorField
            label="Badges"
            value={t.badgeColor}
            onChange={(badgeColor) => set({ badgeColor })}
          />
        </div>

        <Separator />

        {/* ---- decoration ---- */}
        <p className="text-xs font-medium text-muted-foreground">Decoration</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            label="Chips"
            value={t.chipStyle}
            options={[
              { label: 'Pill', value: 'pill' as const },
              { label: 'Box', value: 'box' as const },
              { label: 'Plain', value: 'plain' as const },
            ]}
            onChange={(chipStyle) => set({ chipStyle })}
          />
          <Choice
            label="Chip fill"
            value={t.chipFill}
            options={[
              { label: 'None', value: 'none' as const },
              { label: 'Muted', value: 'muted' as const },
              { label: 'Accent', value: 'accent' as const },
            ]}
            onChange={(chipFill) => set({ chipFill })}
          />
          <Choice
            label="Skills as"
            value={t.skillStyle}
            options={[
              { label: 'Chip groups', value: 'chips' as const },
              { label: 'Inline list', value: 'inline' as const },
            ]}
            onChange={(skillStyle) => set({ skillStyle })}
          />
        </div>

        {/* ---- highlight bullets ---- */}
        <Field
          label="Bullets"
          hint="Highlights on experience, projects and custom items. The ATS-safe preset wants a plain dot — glyph markers can garble when a parser extracts the PDF's text."
        >
          <div className="flex flex-wrap gap-2">
            {BULLET_STYLES.map((b) => (
              <Button
                key={b.value}
                variant={t.bulletStyle === b.value ? 'default' : 'outline'}
                onClick={() => set({ bulletStyle: b.value })}
              >
                <span className="font-mono">{b.marker}</span>
                {b.label}
              </Button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.bulletStyle !== 'none' && (
            <ColorField
              label="Bullet color"
              value={t.bulletColor}
              placeholder="muted"
              onChange={(bulletColor) => set({ bulletColor })}
            />
          )}
          <SliderField
            label="Bullet indent"
            value={t.bulletIndent}
            min={0}
            max={2.5}
            step={0.1}
            suffix="em"
            onChange={(bulletIndent) => set({ bulletIndent })}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Toggle
            label="Uppercase name"
            checked={t.uppercaseName}
            onChange={(uppercaseName) => set({ uppercaseName })}
          />
          <Toggle
            label="Uppercase section headings"
            checked={t.uppercaseHeadings}
            onChange={(uppercaseHeadings) => set({ uppercaseHeadings })}
          />
          <Toggle
            label="Rule under headings"
            checked={t.headingRule}
            onChange={(headingRule) => set({ headingRule })}
          />
          <Toggle
            label="Show icons"
            checked={t.showIcons}
            onChange={(showIcons) => set({ showIcons })}
          />
          {t.showIcons && (
            <Toggle
              label="Brand colors on icons"
              checked={t.brandColorIcons}
              onChange={(brandColorIcons) => set({ brandColorIcons })}
            />
          )}
        </div>

        <Field
          label="Issuer branding"
          hint={
            hasBranding
              ? 'Where this variant shows the issuing company. Every option sits in a page margin, on the sheet’s edge, or behind the text — none of it takes space from the CV or moves a page break. The ATS-safe preset drops all of it: a logo carries no text, and a backdrop sits behind the text a parser reads.'
              : 'Turn on branding in Profile → Issuer branding to place a company’s logo and details on this CV.'
          }
        >
          <div className="flex flex-wrap gap-4">
            <Toggle
              label="Letterhead (top margin)"
              checked={t.brandingMark}
              onChange={(brandingMark) => set({ brandingMark })}
            />
            <Toggle
              label="Footer (bottom margin)"
              checked={t.brandingFooter}
              onChange={(brandingFooter) => set({ brandingFooter })}
            />
            <Toggle
              label="Edge stripe"
              checked={t.brandingEdge}
              onChange={(brandingEdge) => set({ brandingEdge })}
            />
          </div>
        </Field>

        <Choice
          label="Backdrop (behind the text)"
          value={t.brandingBackdrop}
          options={[
            { label: 'None', value: 'none' as const },
            { label: 'Watermark', value: 'watermark' as const },
            { label: 'Tiled', value: 'tile' as const },
          ]}
          onChange={(brandingBackdrop) => set({ brandingBackdrop })}
        />

        {hasBranding && (
          <div className="grid gap-4 sm:grid-cols-2">
            {t.brandingMark && (
              <SliderField
                label="Letterhead logo"
                value={t.brandingLogoSize}
                min={4}
                max={18}
                step={0.5}
                suffix="mm"
                onChange={(brandingLogoSize) => set({ brandingLogoSize })}
              />
            )}
            {t.brandingBackdrop === 'watermark' && (
              <SliderField
                label="Watermark size"
                value={t.brandingWatermarkSize}
                min={30}
                max={160}
                step={5}
                suffix="mm"
                onChange={(brandingWatermarkSize) =>
                  set({ brandingWatermarkSize })
                }
              />
            )}
            {t.brandingBackdrop === 'tile' && (
              <SliderField
                label="Tile size"
                value={t.brandingTileSize}
                min={10}
                max={60}
                step={1}
                suffix="mm"
                onChange={(brandingTileSize) => set({ brandingTileSize })}
              />
            )}
            {t.brandingBackdrop !== 'none' && (
              <SliderField
                label="Backdrop opacity"
                value={t.brandingWatermarkOpacity}
                min={0.01}
                max={0.2}
                step={0.01}
                onChange={(brandingWatermarkOpacity) =>
                  set({ brandingWatermarkOpacity })
                }
              />
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
