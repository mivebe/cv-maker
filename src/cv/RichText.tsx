import { Fragment, type ReactNode } from 'react'

/**
 * Minimal inline markup for body copy: `**bold**`, `*italic*`, `` `code` `` and
 * `[label](url)`. The reference CV leans on bold runs inside bullets ("supplying
 * over **20 games** to **80+ jurisdictions**") to carry the scannable facts, and
 * a plain string cannot express that.
 *
 * Parsed into React nodes rather than injected as HTML: profile content is
 * user-supplied and round-trips through JSON import, so it never becomes markup.
 * Unmatched delimiters are left as literal text, which keeps a stray `*` from
 * eating the rest of a line.
 */

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

export function parseInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const parts = text.split(TOKEN)

  parts.forEach((part, i) => {
    if (!part) return

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push(<strong key={i}>{part.slice(2, -2)}</strong>)
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      out.push(<em key={i}>{part.slice(1, -1)}</em>)
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push(
        <code key={i} className="cv-code">
          {part.slice(1, -1)}
        </code>,
      )
    } else if (part.startsWith('[')) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
      if (m) {
        out.push(
          <a key={i} href={m[2]} className="cv-link">
            {m[1]}
          </a>,
        )
        return
      }
      out.push(<Fragment key={i}>{part}</Fragment>)
    } else {
      out.push(<Fragment key={i}>{part}</Fragment>)
    }
  })

  return out
}

/** Strip inline markup, for the ATS linear-text view and PDF text checks. */
export function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function RichText({ text }: { text: string }) {
  return <>{parseInline(text)}</>
}
