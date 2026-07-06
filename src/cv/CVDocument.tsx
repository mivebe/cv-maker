import { forwardRef } from 'react'
import type { ThemeConfig } from '../schema'
import type {
  ResolvedCV,
  ResolvedSection,
} from '../lib/resolve'
import { themeDataAttrs, themeToStyle } from './themeVars'
import './cv.css'

/** Section kinds that flow into the sidebar when a theme uses two columns. */
const SIDEBAR_KINDS = new Set(['skills', 'education'])

function formatRange(start: string, end: string, current: boolean): string {
  const right = current ? 'Present' : end
  return [start, right].filter(Boolean).join(' – ')
}

function Bullets({ items }: { items: string[] }) {
  const shown = items.filter((b) => b.trim())
  if (!shown.length) return null
  return (
    <ul className="cv-bullets">
      {shown.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  )
}

function SectionBlock({ section }: { section: ResolvedSection }) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-title">{section.label}</h2>
      {section.kind === 'experience' &&
        section.items.map((it) => (
          <div key={it.id} className="cv-item">
            <div className="cv-item-head">
              <span>
                <span className="cv-item-title">{it.role}</span>
                {it.organization && (
                  <span className="cv-item-sub"> - {it.organization}</span>
                )}
              </span>
              <span className="cv-item-meta">
                {formatRange(it.startDate, it.endDate, it.current)}
                {it.location ? ` · ${it.location}` : ''}
              </span>
            </div>
            {it.summary && <p className="cv-item-summary">{it.summary}</p>}
            <Bullets items={it.highlights} />
          </div>
        ))}

      {section.kind === 'education' &&
        section.items.map((it) => (
          <div key={it.id} className="cv-item">
            <div className="cv-item-head">
              <span>
                <span className="cv-item-title">{it.degree}</span>
                {it.institution && (
                  <span className="cv-item-sub"> - {it.institution}</span>
                )}
              </span>
              <span className="cv-item-meta">
                {formatRange(it.startDate, it.endDate, false)}
                {it.location ? ` · ${it.location}` : ''}
              </span>
            </div>
            {it.details && <p className="cv-item-summary">{it.details}</p>}
          </div>
        ))}

      {section.kind === 'skills' &&
        section.items.map((g) => (
          <div key={g.id} className="cv-skillgroup">
            <span className="cv-skillgroup-name">{g.name}: </span>
            <span className="cv-skillgroup-list">
              {g.skills.filter((s) => s.trim()).join(', ')}
            </span>
          </div>
        ))}

      {section.kind === 'projects' &&
        section.items.map((it) => (
          <div key={it.id} className="cv-item">
            <div className="cv-item-head">
              <span className="cv-item-title">{it.name}</span>
              {it.url && <span className="cv-item-meta">{it.url}</span>}
            </div>
            {it.description && (
              <p className="cv-item-summary">{it.description}</p>
            )}
            <Bullets items={it.highlights} />
          </div>
        ))}

      {section.kind === 'custom' &&
        section.items.map((it) => (
          <div key={it.id} className="cv-item">
            <div className="cv-item-head">
              <span>
                <span className="cv-item-title">{it.title}</span>
                {it.subtitle && (
                  <span className="cv-item-sub"> - {it.subtitle}</span>
                )}
              </span>
              {it.date && <span className="cv-item-meta">{it.date}</span>}
            </div>
            {it.description && (
              <p className="cv-item-summary">{it.description}</p>
            )}
            <Bullets items={it.highlights} />
          </div>
        ))}
    </section>
  )
}

export interface CVDocumentProps {
  cv: ResolvedCV
  theme: ThemeConfig
}

/**
 * Renders a resolved CV as semantic HTML. The forwarded ref points at the
 * `.cv-root` element (which carries the theme's inline CSS variables) so that
 * react-to-print clones the document *with* its styling and no app chrome.
 * Real headings and a single logical reading order keep the ATS theme parseable.
 */
export const CVDocument = forwardRef<HTMLDivElement, CVDocumentProps>(
  function CVDocument({ cv, theme }, ref) {
    const { basics, sections } = cv
    const twoCol = theme.columns === 2

    const main = twoCol
      ? sections.filter((s) => !SIDEBAR_KINDS.has(s.kind))
      : sections
    const side = twoCol
      ? sections.filter((s) => SIDEBAR_KINDS.has(s.kind))
      : []

    return (
      <div
        className="cv-root"
        style={themeToStyle(theme)}
        {...themeDataAttrs(theme)}
        ref={ref}
      >
        <div className="cv-page">
          <header className="cv-header">
            <h1 className="cv-name">{basics.name || 'Your Name'}</h1>
            {basics.headline && (
              <p className="cv-headline">{basics.headline}</p>
            )}
            <div className="cv-contact">
              {basics.email && <span>{basics.email}</span>}
              {basics.phone && <span>{basics.phone}</span>}
              {basics.location && <span>{basics.location}</span>}
              {basics.links.map((l) => (
                <a key={l.id} href={l.url}>
                  {l.label || l.url}
                </a>
              ))}
            </div>
            {basics.summary && <p className="cv-summary">{basics.summary}</p>}
          </header>

          <div className={`cv-body${twoCol ? ' cv-two-col' : ''}`}>
            {twoCol ? (
              <>
                <div className="cv-col-main">
                  {main.map((s) => (
                    <SectionBlock key={s.key} section={s} />
                  ))}
                </div>
                <div className="cv-col-side">
                  {side.map((s) => (
                    <SectionBlock key={s.key} section={s} />
                  ))}
                </div>
              </>
            ) : (
              sections.map((s) => <SectionBlock key={s.key} section={s} />)
            )}
          </div>
        </div>
      </div>
    )
  },
)
