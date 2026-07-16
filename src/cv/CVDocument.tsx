import { forwardRef, type CSSProperties } from 'react'
import type {
  Basics,
  CustomItem,
  ExperienceItem,
  ProjectItem,
  ThemeConfig,
  TotalItem,
} from '../schema'
import type { ResolvedCV, ResolvedSection } from '../lib/resolve'
import { BASICS_ID, useHighlightNode } from '../components/variant/highlight'
import { displayPhone, telHref } from '../lib/phone'
import { formatDate, type DateFormat } from '../lib/dates'
import { paginate } from './layout'
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
}: {
  item: ExperienceItem
  format: DateFormat
}) {
  const hl = useHighlightNode()
  return (
    <article className="cv-item" {...hl(item.id)}>
      <h3 className="cv-item-title">{item.role}</h3>
      {item.organization && (
        <div className="cv-item-org">{item.organization}</div>
      )}
      <MetaRow
        date={formatRange(item.startDate, item.endDate, format, item.current)}
        location={item.location}
      />
      {item.summary && (
        <p className="cv-item-summary">
          <RichText text={item.summary} />
        </p>
      )}
      <ChipGroup legend={item.tagsLabel} items={item.tags} />
      <Bullets items={item.highlights} />
    </article>
  )
}

function ProjectBlock({ item }: { item: ProjectItem }) {
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
        {item.description && (
          <p className="cv-item-summary">
            <RichText text={item.description} />
          </p>
        )}
        <Bullets items={item.highlights} />
      </div>
    </article>
  )
}

function CustomBlock({
  item,
  format,
}: {
  item: CustomItem
  format: DateFormat
}) {
  const hl = useHighlightNode()
  return (
    <article className="cv-item" {...hl(item.id)}>
      <div className="cv-title-row">
        <h3 className="cv-item-title">
          {item.icon && <CVIcon name={item.icon} size={13} />}
          {item.title}
        </h3>
        {item.meta && <span className="cv-item-meta">{item.meta}</span>}
      </div>
      {item.subtitle && <div className="cv-item-org">{item.subtitle}</div>}
      <MetaRow date={formatDate(item.date, format)} />
      <ChipGroup legend={item.tagsLabel} items={item.tags} />
      {item.description && (
        <p className="cv-item-summary">
          <RichText text={item.description} />
        </p>
      )}
      <Bullets items={item.highlights} />
    </article>
  )
}

/**
 * Cells carry their position in the row so CSS can drop the divider (and the
 * outer padding) on the edges: `:nth-child()` cannot take the column count,
 * which is a theme token.
 */
function TotalsGrid({
  items,
  columns,
}: {
  items: TotalItem[]
  columns: number
}) {
  const cols = Math.max(1, columns)
  const hl = useHighlightNode()
  return (
    <div className="cv-totals">
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

  return (
    <section
      className="cv-section"
      data-kind={section.kind}
      {...hl(section.key)}
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
          <ExperienceBlock key={it.id} item={it} format={theme.dateFormat} />
        ))}

      {section.kind === 'education' &&
        section.items.map((it) => (
          <article key={it.id} className="cv-item" {...hl(it.id)}>
            <h3 className="cv-item-title">{it.degree}</h3>
            {it.institution && (
              <div className="cv-item-org">{it.institution}</div>
            )}
            <MetaRow
              date={formatRange(it.startDate, it.endDate, theme.dateFormat)}
              location={it.location}
            />
            {it.details && (
              <p className="cv-item-summary">
                <RichText text={it.details} />
              </p>
            )}
          </article>
        ))}

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
        section.items.map((it) => <ProjectBlock key={it.id} item={it} />)}

      {section.kind === 'custom' &&
        (section.columns > 1 ? (
          <div
            className="cv-custom-grid"
            style={{ '--cv-custom-cols': section.columns } as CSSProperties}
          >
            {section.items.map((it) => (
              <CustomBlock key={it.id} item={it} format={theme.dateFormat} />
            ))}
          </div>
        ) : (
          section.items.map((it) => (
            <CustomBlock key={it.id} item={it} format={theme.dateFormat} />
          ))
        ))}

      {section.kind === 'totals' && (
        <TotalsGrid items={section.items} columns={theme.totalsColumns} />
      )}
    </section>
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

function Header({ basics, theme }: { basics: Basics; theme: ThemeConfig }) {
  const hl = useHighlightNode()
  const contacts = [
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
    ...basics.links.map((l) => ({
      key: l.id,
      icon: l.icon || 'link',
      text: l.label || prettyUrl(l.url),
      url: l.url ? href(l.url) : '',
    })),
  ].filter(Boolean) as {
    key: string
    icon: string
    text: string
    url: string
  }[]

  return (
    <header className="cv-header" {...hl(BASICS_ID)}>
      <div className="cv-header-row">
        <div className="cv-identity">
          <h1 className="cv-name">{basics.name || 'Your Name'}</h1>
          {basics.headline && <p className="cv-headline">{basics.headline}</p>}
        </div>

        {contacts.length > 0 && (
          <ul className="cv-contact">
            {contacts.map((c) => (
              <li key={c.key}>
                <CVIcon name={c.icon} size={13} />
                {c.url ? (
                  <a className="cv-link" href={c.url}>
                    {c.text}
                  </a>
                ) : (
                  <span>{c.text}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <Avatar basics={basics} theme={theme} />
      </div>

      {basics.summary && (
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
    const { basics, sections } = cv
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
                      <SectionBlock key={s.key} section={s} theme={theme} />
                    ))}
                  </div>
                  <div className="cv-col cv-col-side">
                    {band.side.map((s) => (
                      <SectionBlock key={s.key} section={s} theme={theme} />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    )
  },
)
