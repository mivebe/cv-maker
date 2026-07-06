import type { ThemeConfig } from '../schema'
import type { ResolvedCV } from './resolve'

/**
 * ATS tooling. Applicant-tracking systems read a PDF as a stream of text in one
 * reading order. The functions here (a) model that linear text from the
 * resolved CV, (b) run structural checks that predict clean parsing, and
 * (c) extract text from an actual exported PDF so the loop can be closed:
 * "does the file we produced come back out as the structured text we expect?"
 */

/** The plain text an ATS should see, in logical reading order. */
export function atsLinearText(cv: ResolvedCV): string {
  const lines: string[] = []
  const { basics, sections } = cv
  if (basics.name) lines.push(basics.name)
  if (basics.headline) lines.push(basics.headline)
  const contact = [basics.email, basics.phone, basics.location]
    .filter(Boolean)
    .concat(basics.links.map((l) => l.url))
  if (contact.length) lines.push(contact.join(' · '))
  if (basics.summary) lines.push('', basics.summary)

  for (const section of sections) {
    lines.push('', section.label.toUpperCase())
    if (section.kind === 'experience') {
      for (const it of section.items) {
        lines.push(
          `${it.role}${it.organization ? ` - ${it.organization}` : ''} (${[it.startDate, it.current ? 'Present' : it.endDate].filter(Boolean).join('–')})`,
        )
        if (it.summary) lines.push(it.summary)
        it.highlights.filter((h) => h.trim()).forEach((h) => lines.push(`• ${h}`))
      }
    } else if (section.kind === 'education') {
      for (const it of section.items) {
        lines.push(`${it.degree}${it.institution ? ` - ${it.institution}` : ''}`)
        if (it.details) lines.push(it.details)
      }
    } else if (section.kind === 'skills') {
      for (const g of section.items) {
        lines.push(`${g.name}: ${g.skills.filter((s) => s.trim()).join(', ')}`)
      }
    } else if (section.kind === 'projects') {
      for (const it of section.items) {
        lines.push(it.name)
        if (it.description) lines.push(it.description)
        it.highlights.filter((h) => h.trim()).forEach((h) => lines.push(`• ${h}`))
      }
    } else if (section.kind === 'custom') {
      for (const it of section.items) {
        lines.push(`${it.title}${it.subtitle ? ` - ${it.subtitle}` : ''}`)
        if (it.description) lines.push(it.description)
        it.highlights.filter((h) => h.trim()).forEach((h) => lines.push(`• ${h}`))
      }
    }
  }
  return lines.join('\n')
}

export type CheckLevel = 'pass' | 'warn' | 'fail'
export interface AtsCheck {
  level: CheckLevel
  label: string
  detail?: string
}

/** Standard section names ATS parsers recognize. */
const STANDARD_LABELS = new Set([
  'experience',
  'work experience',
  'employment',
  'education',
  'skills',
  'projects',
])

/** Predict how cleanly a resolved CV + theme will parse in an ATS. */
export function atsChecks(cv: ResolvedCV, theme: ThemeConfig): AtsCheck[] {
  const checks: AtsCheck[] = []
  const { basics, sections } = cv

  checks.push(
    basics.name
      ? { level: 'pass', label: 'Name present' }
      : { level: 'fail', label: 'Name is missing' },
  )
  checks.push(
    basics.email || basics.phone
      ? { level: 'pass', label: 'Contact details present' }
      : { level: 'warn', label: 'No email or phone', detail: 'Recruiters may not be able to reach you.' },
  )

  checks.push(
    theme.columns === 1
      ? { level: 'pass', label: 'Single-column layout' }
      : {
          level: 'warn',
          label: 'Two-column layout',
          detail:
            'Some ATS parsers scramble reading order in multi-column CVs. Use the ATS-safe preset for maximum compatibility.',
        },
  )

  const recognized = sections.filter((s) =>
    STANDARD_LABELS.has(s.label.trim().toLowerCase()),
  ).length
  checks.push(
    recognized > 0
      ? {
          level: 'pass',
          label: `${recognized} standard section heading(s) recognized`,
        }
      : {
          level: 'warn',
          label: 'No standard section headings',
          detail: 'Use headings like "Experience", "Education", "Skills".',
        },
  )

  const empty = sections.filter((s) => s.items.length === 0).length
  checks.push(
    empty === 0
      ? { level: 'pass', label: 'No empty sections' }
      : { level: 'warn', label: `${empty} empty section(s)` },
  )

  const hasExperience = sections.some((s) => s.kind === 'experience')
  checks.push(
    hasExperience
      ? { level: 'pass', label: 'Experience section included' }
      : { level: 'warn', label: 'No experience section shown' },
  )

  return checks
}

/**
 * Validate extracted PDF text against the CV we expect. Confirms the name,
 * every visible section heading, and a sample of body text survived the
 * round-trip through the print pipeline (i.e. the PDF is real text, not an image).
 */
export interface ExtractionResult {
  charCount: number
  checks: AtsCheck[]
}

export function validateExtraction(
  cv: ResolvedCV,
  extractedText: string,
): ExtractionResult {
  const haystack = extractedText.toLowerCase().replace(/\s+/g, ' ')
  const contains = (needle: string) =>
    needle.trim().length > 0 &&
    haystack.includes(needle.toLowerCase().replace(/\s+/g, ' '))

  const checks: AtsCheck[] = []

  checks.push({
    level: haystack.trim().length > 50 ? 'pass' : 'fail',
    label: 'PDF contains extractable text',
    detail:
      haystack.trim().length > 50
        ? undefined
        : 'Almost no text extracted - the PDF may be a rasterized image (not ATS-safe).',
  })

  if (cv.basics.name) {
    checks.push({
      level: contains(cv.basics.name) ? 'pass' : 'fail',
      label: `Name "${cv.basics.name}" found`,
    })
  }

  for (const s of cv.sections) {
    checks.push({
      level: contains(s.label) ? 'pass' : 'warn',
      label: `Heading "${s.label}" found`,
    })
  }

  // Sample the first highlight/summary we can find as a body-text probe.
  const probe = firstBodyProbe(cv)
  if (probe) {
    checks.push({
      level: contains(probe) ? 'pass' : 'warn',
      label: 'Body text preserved',
      detail: contains(probe) ? undefined : `Could not find: "${probe.slice(0, 40)}…"`,
    })
  }

  return { charCount: extractedText.length, checks }
}

function firstBodyProbe(cv: ResolvedCV): string | null {
  for (const s of cv.sections) {
    if (s.kind === 'experience') {
      for (const it of s.items) {
        if (it.highlights[0]?.trim()) return it.highlights[0]
        if (it.summary?.trim()) return it.summary
      }
    }
  }
  return cv.basics.summary || null
}
