import { forwardRef, type CSSProperties } from 'react'
import type {
  Basics,
  Branding,
  ChartItem,
  CustomItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  SectionOptions,
  SliderItem,
  ThemeConfig,
  TotalItem,
} from '../schema'
import type { ResolvedCV, ResolvedSection } from '../lib/resolve'
import { BASICS_ID, useHighlightNode } from '../components/variant/highlight'
import { displayPhone, telHref } from '../lib/phone'
import { formatDate, type DateFormat } from '../lib/dates'
import { LANGUAGE_STAGES } from '../lib/sections'
import { paginate } from './layout'
import { chartColors, chartMarker, slicePath } from './chart'
import { CVIcon } from './icons'
import { RichText } from './RichText'
import { themeDataAttrs, themeToStyle } from './themeVars'
import './cv.css'

/**
 * Renders a resolved CV as semantic HTML. The forwarded ref points at the
 * `.cv-root` element (which carries the theme's inline CSS variables) so that
 * react-to-print clones the document *with* its styling and no app chrome.
 * Real headings and a single logical reading order keep the ATS theme parseable;
 * every icon is decorative and contributes no text to the exported PDF.
 */

/**
 * `format` is the variant's date format; "Present" and any other text the date
 * parser doesn't recognise passes through as typed (see lib/dates).
 */
function formatRange(
  start: string,
  end: string,
  format: DateFormat,
  current = false,
): string {
  const right = current ? 'Present' : formatDate(end, format)
  return [formatDate(start, format), right].filter(Boolean).join(' – ')
}

/** Links read better without the scheme: `github.com/mivebe`, not `https://…`. */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function href(url: string): string {
  return /^[a-z]+:/i.test(url) ? url : `https://${url}`
}

function Bullets({ items }: { items: string[] }) {
  const shown = items.filter((b) => b.trim())
  if (!shown.length) return null
  return (
    <ul className="cv-bullets">
      {shown.map((b, i) => (
        <li key={i}>
          <RichText text={b} />
        </li>
      ))}
    </ul>
  )
}

/** A bordered chip group with an optional notched legend ("TechStack"). */
function ChipGroup({ legend, items }: { legend: string; items: string[] }) {
  const chips = items.filter((c) => c.trim())
  if (!chips.length) return null
  return (
    <div className="cv-chipgroup" data-legend={legend ? 'true' : 'false'}>
      {legend && <span className="cv-chipgroup-legend">{legend}</span>}
      <div className="cv-chips">
        {chips.map((c, i) => (
          <span key={i} className="cv-chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Date / location line under an item title. */
function MetaRow({ date, location }: { date?: string; location?: string }) {
  if (!date && !location) return null
  return (
    <div className="cv-meta-row">
      {date && (
        <span className="cv-meta">
          <CVIcon name="calendar" mono />
          {date}
        </span>
      )}
      {location && (
        <span className="cv-meta">
          <CVIcon name="map-pin" mono />
          {location}
        </span>
      )}
    </div>
  )
}

function ExperienceBlock({
  item,
  format,
  options,
}: {
  item: ExperienceItem
  format: DateFormat
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  const date = formatRange(item.startDate, item.endDate, format, item.current)
  const dateRight = options.datePosition === 'right'
  return (
    <article className="cv-item" {...hl(item.id)}>
      <div className="cv-title-row">
        <h3 className="cv-item-title">{item.role}</h3>
        {dateRight && date && <span className="cv-item-meta">{date}</span>}
      </div>
      {item.organization && (
        <div className="cv-item-org">{item.organization}</div>
      )}
      <MetaRow date={dateRight ? undefined : date} location={item.location} />
      {options.showDescription && item.summary && (
        <p className="cv-item-summary">
          <RichText text={item.summary} />
        </p>
      )}
      <ChipGroup legend={item.tagsLabel} items={item.tags} />
      {options.showHighlights && <Bullets items={item.highlights} />}
    </article>
  )
}

function ProjectBlock({
  item,
  options,
}: {
  item: ProjectItem
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  return (
    <article className="cv-item cv-portfolio" {...hl(item.id)}>
      {item.icon && (
        <span className="cv-portfolio-icon">
          <CVIcon name={item.icon} size={14} />
        </span>
      )}
      <div className="cv-portfolio-body">
        <div className="cv-title-row">
          <h3 className="cv-item-title">{item.name}</h3>
          {item.badge && <span className="cv-badge">{item.badge}</span>}
          {item.meta && <span className="cv-item-meta">{item.meta}</span>}
        </div>
        {item.url && (
          <a className="cv-link" href={href(item.url)}>
            {prettyUrl(item.url)}
          </a>
        )}
        {options.showDescription && item.description && (
          <p className="cv-item-summary">
            <RichText text={item.description} />
          </p>
        )}
        {options.showHighlights && <Bullets items={item.highlights} />}
      </div>
    </article>
  )
}

function CustomBlock({
  item,
  format,
  options,
}: {
  item: CustomItem
  format: DateFormat
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  const date = formatDate(item.date, format)
  const dateRight = options.datePosition === 'right'
  // An item can legitimately carry nothing but a chip group - that is how a
  // labelled list ("Frameworks: LangGraph, FastAPI") is expressed outside the
  // one built-in skills section. Rendering the row regardless would print an
  // empty heading and its leading, so the space has to be earned.
  const hasTitleRow = Boolean(
    item.icon || item.title || item.meta || (dateRight && date),
  )
  return (
    <article className="cv-item" {...hl(item.id)}>
      {hasTitleRow && (
        <div className="cv-title-row">
          <h3 className="cv-item-title">
            {item.icon && <CVIcon name={item.icon} size={13} />}
            {item.title}
          </h3>
          {dateRight && date && <span className="cv-item-meta">{date}</span>}
          {item.meta && <span className="cv-item-meta">{item.meta}</span>}
        </div>
      )}
      {item.subtitle && <div className="cv-item-org">{item.subtitle}</div>}
      {!dateRight && <MetaRow date={date} />}
      <ChipGroup legend={item.tagsLabel} items={item.tags} />
      {options.showDescription && item.description && (
        <p className="cv-item-summary">
          <RichText text={item.description} />
        </p>
      )}
      {options.showHighlights && <Bullets items={item.highlights} />}
    </article>
  )
}

/**
 * Cells carry their position in the row so CSS can drop the divider (and the
 * outer padding) on the edges: `:nth-child()` cannot take the column count,
 * which is a section option.
 */
function TotalsGrid({
  items,
  columns,
}: {
  items: TotalItem[]
  columns: number
}) {
  const cols = Math.max(1, Math.round(columns))
  const hl = useHighlightNode()
  return (
    <div
      className="cv-totals"
      style={{ '--cv-totals-cols': cols } as CSSProperties}
    >
      {items.map((t, i) => (
        <div
          key={t.id}
          className="cv-total"
          data-row-start={String(i % cols === 0)}
          data-row-end={String(i % cols === cols - 1 || i === items.length - 1)}
          {...hl(t.id)}
        >
          <CVIcon name={t.icon || t.label} size={20} />
          <span className="cv-total-label">{t.label}</span>
          <span className="cv-total-value">{t.value}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Chart ---------------------------------------------------------------------
 *
 * Hand-rolled SVG (pie/donut) and plain divs (bar/hbar) - see cv/chart.ts for
 * why there is no chart library. The marker on each slice/bar matches its
 * legend row, so the chart carries only the shape while the legend carries the
 * words - that linkage is what keeps a chart readable at CV scale. Under the
 * `ats` preset only the legend renders: PDF text extractors can choke on
 * inline SVG, and that is a correctness rule, not a preference.
 */
function ChartBlock({
  items,
  options,
  theme,
}: {
  items: ChartItem[]
  options: SectionOptions
  theme: ThemeConfig
}) {
  const hl = useHighlightNode()
  const shown = items.filter((i) => i.value > 0)
  if (!shown.length) return null

  const total = shown.reduce((sum, i) => sum + i.value, 0)
  const colors = chartColors(
    theme.accentColor,
    shown.length,
    options.chartPalette,
  )
  const type = options.chartType
  // `auto`: parts-of-a-whole shapes read as percentages, bars as raw values.
  const asPercent =
    options.chartValueFormat === 'percent' ||
    (options.chartValueFormat === 'auto' && (type === 'pie' || type === 'donut'))
  const value = (v: number) =>
    asPercent ? `${Math.round((v / total) * 100)}%` : String(v)

  const legend = (
    <div className="cv-chart-legend">
      {shown.map((it, i) => (
        <div key={it.id} className="cv-chart-row" {...hl(it.id)}>
          <span
            className="cv-chart-swatch"
            style={{ background: colors[i] }}
            aria-hidden
          >
            {chartMarker(options.chartMarker, i)}
          </span>
          {it.icon && <CVIcon name={it.icon} size={12} />}
          <span className="cv-chart-title">{it.title}</span>
          {options.chartShowValue && (
            <span className="cv-chart-value">{value(it.value)}</span>
          )}
        </div>
      ))}
    </div>
  )

  // ATS: the legend already carries every word and number; the drawing would
  // only be noise (or a hazard) to a parser.
  if (theme.preset === 'ats') return <div className="cv-chart">{legend}</div>

  let drawing: React.ReactNode = null

  if (type === 'pie' || type === 'donut') {
    const rInner = type === 'donut' ? 24 : 0
    let acc = 0
    drawing = (
      <svg className="cv-chart-svg" viewBox="0 0 100 100" aria-hidden>
        {shown.map((it, i) => {
          const from = acc / total
          acc += it.value
          const to = acc / total
          const [mx, my] = midpoint(from, to, rInner ? 37 : 33)
          return (
            <g key={it.id}>
              {to - from >= 1 ? (
                // A single slice is the full disc; an arc with coincident
                // endpoints draws nothing.
                <circle cx={50} cy={50} r={48} fill={colors[i]} />
              ) : (
                <path
                  d={slicePath(50, 50, 48, rInner, from, to)}
                  fill={colors[i]}
                />
              )}
              {options.chartMarker !== 'none' && to - from > 0.04 && (
                <text
                  x={mx}
                  y={my}
                  className="cv-chart-slice-label"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {chartMarker(options.chartMarker, i)}
                </text>
              )}
            </g>
          )
        })}
        {type === 'donut' && (
          <circle cx={50} cy={50} r={rInner} fill="#fff" />
        )}
      </svg>
    )
  } else {
    const max = Math.max(...shown.map((i) => i.value))
    drawing =
      type === 'bar' ? (
        <div className="cv-chart-bars" aria-hidden>
          {shown.map((it, i) => (
            <div key={it.id} className="cv-chart-barcol">
              {options.chartShowValue && (
                <span className="cv-chart-barvalue">{value(it.value)}</span>
              )}
              <div
                className="cv-chart-bar"
                style={{
                  height: `${Math.max(4, (it.value / max) * 100)}%`,
                  background: colors[i],
                }}
              />
              <span className="cv-chart-barmark">
                {chartMarker(options.chartMarker, i)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cv-chart-hbars" aria-hidden>
          {shown.map((it, i) => (
            <div key={it.id} className="cv-chart-hbarrow">
              <span className="cv-chart-barmark">
                {chartMarker(options.chartMarker, i)}
              </span>
              <div className="cv-chart-hbartrack">
                <div
                  className="cv-chart-hbar"
                  style={{
                    width: `${Math.max(3, (it.value / max) * 100)}%`,
                    background: colors[i],
                  }}
                />
              </div>
              {options.chartShowValue && (
                <span className="cv-chart-barvalue">{value(it.value)}</span>
              )}
            </div>
          ))}
        </div>
      )
  }

  return (
    <div className="cv-chart" data-type={type}>
      {drawing}
      {legend}
    </div>
  )
}

/** Label anchor inside a slice, at its angular midpoint. */
function midpoint(from: number, to: number, r: number): [number, number] {
  const a = ((from + to) / 2) * Math.PI * 2 - Math.PI / 2
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]
}

/** A dot on a stepped track, filled up to the value. */
function SliderTrack({ value, steps }: { value: number; steps: number }) {
  const max = Math.max(2, Math.round(steps))
  const frac = (Math.min(Math.max(1, value), max) - 1) / (max - 1)
  return (
    <div className="cv-slider-track" aria-hidden>
      <div className="cv-slider-fill" style={{ width: `${frac * 100}%` }} />
      <span className="cv-slider-dot" style={{ left: `${frac * 100}%` }} />
    </div>
  )
}

function SlidersBlock({
  items,
  options,
}: {
  items: SliderItem[]
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  const hasLabels =
    options.sliderShowLabels &&
    (options.sliderStartLabel || options.sliderEndLabel)
  return (
    <div>
      <div className="cv-sliders cv-list-grid">
        {items.map((it) => (
          <div key={it.id} className="cv-slider-row" {...hl(it.id)}>
            <div className="cv-slider-head">
              <span className="cv-slider-title">{it.title}</span>
              {it.subtitle && (
                <span className="cv-slider-subtitle">{it.subtitle}</span>
              )}
            </div>
            <SliderTrack value={it.value} steps={options.sliderSteps} />
          </div>
        ))}
      </div>
      {hasLabels && (
        <div className="cv-slider-labels">
          <span>{options.sliderStartLabel}</span>
          <span>{options.sliderEndLabel}</span>
        </div>
      )}
    </div>
  )
}

function TitleListBlock({
  items,
  options,
}: {
  items: { id: string; icon: string; title: string; subtitle: string }[]
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  return (
    <div className="cv-titlelist cv-list-grid">
      {items.map((it) => (
        <div key={it.id} className="cv-titleitem" {...hl(it.id)}>
          {it.icon && <CVIcon name={it.icon} size={14} />}
          <div className="cv-titleitem-body">
            <span className="cv-titleitem-title">{it.title}</span>
            {options.showSubtitle && it.subtitle && (
              <span className="cv-titleitem-subtitle">{it.subtitle}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Languages. The stage labels come from LANGUAGE_STAGES, never typed, so the
 * words and the notch count cannot disagree. Slider mode is the only display
 * that goes *below* the name: a track plus three labels does not fit beside a
 * language in a side column.
 */
function LanguagesBlock({
  items,
  options,
}: {
  items: LanguageItem[]
  options: SectionOptions
}) {
  const hl = useHighlightNode()
  const mode = options.languageDisplay
  const stage = (level: number) =>
    LANGUAGE_STAGES[Math.min(Math.max(1, Math.round(level)), 4) - 1]
  return (
    <div className="cv-languages cv-list-grid" data-mode={mode}>
      {items.map((it) => (
        <div key={it.id} className="cv-language" {...hl(it.id)}>
          <div className="cv-language-row">
            <span className="cv-language-name">{it.name}</span>
            {mode === 'words' && (
              <span className="cv-language-stage">{stage(it.level)}</span>
            )}
            {mode === 'notches' && (
              <span className="cv-language-notches" aria-hidden>
                {LANGUAGE_STAGES.map((_, i) => (
                  <span
                    key={i}
                    className="cv-language-notch"
                    data-filled={String(i < it.level)}
                  />
                ))}
              </span>
            )}
          </div>
          {mode === 'slider' && (
            <>
              <SliderTrack value={it.level} steps={4} />
              {options.languageShowLabels && (
                <div className="cv-slider-labels">
                  <span>{LANGUAGE_STAGES[0]}</span>
                  <span className="cv-language-current">
                    {stage(it.level)}
                  </span>
                  <span>{LANGUAGE_STAGES[3]}</span>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/** Sections whose heading is centered between rules rather than left-aligned. */
const CENTERED_KINDS = new Set(['totals', 'banner'])

function SectionBlock({
  section,
  theme,
}: {
  section: ResolvedSection
  theme: ThemeConfig
}) {
  const centered = CENTERED_KINDS.has(section.kind)
  const hl = useHighlightNode()
  const options = section.options

  return (
    <section
      className="cv-section"
      data-kind={section.kind}
      data-dividers={String(options.rowDividers)}
      // Subtractive only: theme.showIcons stays the master gate (cv.css hides
      // icons document-wide first), this can additionally mute one section.
      data-icons={String(options.showIcons)}
      {...hl(section.id)}
    >
      <h2
        className="cv-section-title"
        data-align={centered ? 'center' : 'left'}
      >
        <span>{section.label}</span>
      </h2>
      {section.subtitle && (
        <p className="cv-section-subtitle">{section.subtitle}</p>
      )}

      {section.kind === 'experience' &&
        section.items.map((it) => (
          <ExperienceBlock
            key={it.id}
            item={it}
            format={theme.dateFormat}
            options={options}
          />
        ))}

      {section.kind === 'education' &&
        section.items.map((it) => {
          const date = formatRange(it.startDate, it.endDate, theme.dateFormat)
          const dateRight = options.datePosition === 'right'
          return (
            <article key={it.id} className="cv-item" {...hl(it.id)}>
              <div className="cv-title-row">
                <h3 className="cv-item-title">{it.degree}</h3>
                {dateRight && date && (
                  <span className="cv-item-meta">{date}</span>
                )}
              </div>
              {it.institution && (
                <div className="cv-item-org">{it.institution}</div>
              )}
              <MetaRow
                date={dateRight ? undefined : date}
                location={it.location}
              />
              {options.showDescription && it.details && (
                <p className="cv-item-summary">
                  <RichText text={it.details} />
                </p>
              )}
            </article>
          )
        })}

      {section.kind === 'skills' &&
        section.items.map((g) => (
          <div key={g.id} className="cv-skillgroup" {...hl(g.id)}>
            <ChipGroup legend={g.name} items={g.skills} />
            {/* The inline fallback (theme.skillStyle = 'inline'); CSS shows one or the other. */}
            <div className="cv-skillgroup-inline">
              <span className="cv-skillgroup-name">{g.name}: </span>
              <span>{g.skills.filter((s) => s.trim()).join(', ')}</span>
            </div>
          </div>
        ))}

      {section.kind === 'projects' &&
        section.items.map((it) => (
          <ProjectBlock key={it.id} item={it} options={options} />
        ))}

      {section.kind === 'items' &&
        (options.columns > 1 ? (
          <div
            className="cv-custom-grid"
            style={{ '--cv-custom-cols': options.columns } as CSSProperties}
          >
            {section.items.map((it) => (
              <CustomBlock
                key={it.id}
                item={it}
                format={theme.dateFormat}
                options={options}
              />
            ))}
          </div>
        ) : (
          section.items.map((it) => (
            <CustomBlock
              key={it.id}
              item={it}
              format={theme.dateFormat}
              options={options}
            />
          ))
        ))}

      {section.kind === 'totals' && (
        <TotalsGrid items={section.items} columns={options.columns} />
      )}

      {section.kind === 'chart' && (
        <ChartBlock items={section.items} options={options} theme={theme} />
      )}

      {section.kind === 'sliders' && (
        <SlidersBlock items={section.items} options={options} />
      )}

      {section.kind === 'titleList' && (
        <TitleListBlock items={section.items} options={options} />
      )}

      {section.kind === 'languages' && (
        <LanguagesBlock items={section.items} options={options} />
      )}
    </section>
  )
}

/**
 * Issuer branding ---------------------------------------------------------
 *
 * Four slots, each independently switchable by the variant's theme. All of it is
 * the *issuer's* identity, so it is deliberately quieter than anything about the
 * candidate - the CV is still about the person, and the studio only signs it.
 *
 * The hard rule: branding costs the document no space, horizontally or
 * vertically. Every slot is `position: absolute` against the sheet and lands in
 * space nothing else uses - the top margin, the bottom margin, the sheet's edge,
 * or the layer behind the text - so turning any of it on cannot reflow a line,
 * shift a column or move a page break.
 *
 * The page is sized in inches and branding sizes are authored in mm (like the
 * margin and the avatar), but CVIcon sizes itself in px - hence the conversion.
 */
const PX_PER_MM = 96 / 25.4

function mmToPx(mm: number): number {
  return Math.round(mm * PX_PER_MM)
}

/** Only an actual image can be painted as a repeating CSS background. */
function isImageRef(name: string): boolean {
  return /^(data:|https?:\/\/|\/)/.test(name)
}

/**
 * Letterhead: the mark sits in the top margin band, which is blank by
 * definition, so it reads as issued-by without touching the name below it.
 */
function BrandMark({
  branding,
  theme,
}: {
  branding: Branding
  theme: ThemeConfig
}) {
  const meta = [branding.issuedFor, branding.issuedDate, branding.reference]
    .map((s) => s.trim())
    .filter(Boolean)

  if (!branding.logo && !branding.company && !meta.length) return null

  // The band is only as tall as the page margin, so the logo is clamped to it
  // rather than allowed to spill onto the content or off the sheet.
  const logoPx = mmToPx(
    Math.min(theme.brandingLogoSize, theme.pageMargin * 0.62),
  )

  return (
    <div className="cv-brandmark">
      {meta.length > 0 && (
        <span className="cv-brandmark-meta">{meta.join(' · ')}</span>
      )}
      <span className="cv-brandmark-lockup">
        {branding.logo && <CVIcon name={branding.logo} size={logoPx} />}
        {branding.company && (
          <span className="cv-brandmark-name">{branding.company}</span>
        )}
        {branding.tagline && (
          <span className="cv-brandmark-tagline">{branding.tagline}</span>
        )}
      </span>
    </div>
  )
}

function BrandFooter({ branding }: { branding: Branding }) {
  const parts = [branding.company, branding.url, branding.contact]
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length && !branding.note.trim()) return null

  return (
    <div className="cv-brandfooter">
      <span className="cv-brandfooter-org">{parts.join(' · ')}</span>
      {branding.note && (
        <span className="cv-brandfooter-note">{branding.note}</span>
      )}
    </div>
  )
}

/**
 * The layer behind the text: one oversized logo, or the logo tiled across the
 * whole sheet. `aria-hidden` and text-free on purpose - it is decoration sitting
 * under the content, and it must not reach the PDF's text layer.
 *
 * The tile is a repeating CSS background, so unlike the watermark it needs a
 * real image; a registry icon key (`github`) has no URL to repeat and falls back
 * to the single mark.
 */
function BrandBackdrop({
  branding,
  theme,
}: {
  branding: Branding
  theme: ThemeConfig
}) {
  if (!branding.logo) return null

  if (theme.brandingBackdrop === 'tile' && isImageRef(branding.logo)) {
    const tile = `${theme.brandingTileSize}mm`
    return (
      <div
        className="cv-brandtile"
        aria-hidden
        style={{
          backgroundImage: `url("${branding.logo}")`,
          backgroundSize: `${tile} ${tile}`,
        }}
      />
    )
  }

  return (
    <div className="cv-watermark" aria-hidden>
      <CVIcon name={branding.logo} size={mmToPx(theme.brandingWatermarkSize)} />
    </div>
  )
}

function Avatar({ basics, theme }: { basics: Basics; theme: ThemeConfig }) {
  if (!theme.showAvatar || !basics.photo) return null
  return (
    <div className="cv-avatar" data-shape={theme.avatarShape}>
      <img
        src={basics.photo}
        alt={basics.photoAlt || basics.name}
        style={{
          objectPosition: `${theme.avatarOffsetX}% ${theme.avatarOffsetY}%`,
          transform: `scale(${theme.avatarZoom})`,
        }}
      />
    </div>
  )
}

interface ContactEntry {
  key: string
  icon: string
  text: string
  url: string
}

function ContactLine({ c }: { c: ContactEntry }) {
  return (
    <>
      <CVIcon name={c.icon} size={13} />
      {c.url ? (
        <a className="cv-link" href={c.url}>
          {c.text}
        </a>
      ) : (
        <span>{c.text}</span>
      )}
    </>
  )
}

function Header({ basics, theme }: { basics: Basics; theme: ThemeConfig }) {
  const hl = useHighlightNode()
  // Runtime fallback: themes persisted before this token existed carry no
  // headerFill (the store does not re-parse through zod on load).
  const fill = theme.headerFill ?? 'none'

  const info = [
    basics.email && {
      key: 'email',
      icon: 'mail',
      text: basics.email,
      url: `mailto:${basics.email}`,
    },
    basics.phone && {
      key: 'phone',
      icon: 'phone',
      text: displayPhone(basics.phoneCode, basics.phone),
      url: telHref(basics.phoneCode, basics.phone),
    },
    basics.location && {
      key: 'location',
      icon: 'map-pin',
      text: basics.location,
      url: '',
    },
  ].filter(Boolean) as ContactEntry[]

  const links: ContactEntry[] = basics.links.map((l) => ({
    key: l.id,
    icon: l.icon || 'link',
    text: l.label || prettyUrl(l.url),
    url: l.url ? href(l.url) : '',
  }))

  // `links` fill moves the profile links under the name; everything else
  // keeps them stacked with the contact details on the right.
  const rightColumn = fill === 'links' ? info : [...info, ...links]

  return (
    <header className="cv-header" {...hl(BASICS_ID)}>
      <div className="cv-header-row">
        <div className="cv-identity">
          <h1 className="cv-name">{basics.name || 'Your Name'}</h1>
          {basics.headline && <p className="cv-headline">{basics.headline}</p>}
          {fill === 'links' && links.length > 0 && (
            <ul className="cv-header-links">
              {links.map((c) => (
                <li key={c.key}>
                  <ContactLine c={c} />
                </li>
              ))}
            </ul>
          )}
          {fill === 'summary' && basics.summary && (
            <p className="cv-summary cv-summary-inline">
              <RichText text={basics.summary} />
            </p>
          )}
        </div>

        {rightColumn.length > 0 && (
          <ul className="cv-contact">
            {rightColumn.map((c) => (
              <li key={c.key}>
                <ContactLine c={c} />
              </li>
            ))}
          </ul>
        )}

        <Avatar basics={basics} theme={theme} />
      </div>

      {fill !== 'summary' && basics.summary && (
        <p className="cv-summary">
          <RichText text={basics.summary} />
        </p>
      )}
    </header>
  )
}

export interface CVDocumentProps {
  cv: ResolvedCV
  theme: ThemeConfig
}

export const CVDocument = forwardRef<HTMLDivElement, CVDocumentProps>(
  function CVDocument({ cv, theme }, ref) {
    const { basics, sections, branding } = cv
    const pages = paginate(sections, theme.columns === 2)
    if (!pages.length) pages.push({ bands: [] })

    return (
      <div
        className="cv-root"
        style={themeToStyle(theme)}
        {...themeDataAttrs(theme)}
        ref={ref}
      >
        {pages.map((page, pageIndex) => (
          <div className="cv-page" key={pageIndex}>
            {/* Branding first in the DOM, but none of it is in the flow: each
                piece is positioned against the sheet. */}
            {branding && theme.brandingBackdrop !== 'none' && (
              <BrandBackdrop branding={branding} theme={theme} />
            )}
            {branding && theme.brandingEdge && (
              <div className="cv-brandedge" aria-hidden />
            )}
            {branding && theme.brandingMark && (
              <BrandMark branding={branding} theme={theme} />
            )}

            {pageIndex === 0 && <Header basics={basics} theme={theme} />}

            {page.bands.map((band, bandIndex) =>
              band.kind === 'full' ? (
                <SectionBlock
                  key={bandIndex}
                  section={band.section}
                  theme={theme}
                />
              ) : (
                <div className="cv-cols" key={bandIndex}>
                  <div className="cv-col cv-col-main">
                    {band.main.map((s) => (
                      <SectionBlock key={s.id} section={s} theme={theme} />
                    ))}
                  </div>
                  <div className="cv-col cv-col-side">
                    {band.side.map((s) => (
                      <SectionBlock key={s.id} section={s} theme={theme} />
                    ))}
                  </div>
                </div>
              ),
            )}

            {branding && theme.brandingFooter && (
              <BrandFooter branding={branding} />
            )}
          </div>
        ))}
      </div>
    )
  },
)
