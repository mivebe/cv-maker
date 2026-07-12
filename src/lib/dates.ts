/**
 * CV dates are half-structured on purpose. What a user types is kept verbatim
 * ("Summer 2020", "Present", "Q3 2019") because a CV tolerates that and a
 * strict parser would only get in the way; but anything that *looks* like a
 * month/year is understood, stored canonically ("2021-03" / "2021"), and then
 * rendered in the format the variant's theme asks for. Text we cannot parse
 * falls through to the page unchanged.
 */

/** A month/year or a bare year — the only precision a CV ever needs. */
export interface PartialDate {
  year: number
  /** 1-12. Absent = the user gave only a year. */
  month?: number
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DATE_FORMATS = [
  'MMM yyyy',
  'MMMM yyyy',
  'MM/yyyy',
  'yyyy-MM',
  'yyyy',
] as const
export type DateFormat = (typeof DATE_FORMATS)[number]

/** Menu labels: show the format by example, not by pattern. */
export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  'MMM yyyy': 'Mar 2021',
  'MMMM yyyy': 'March 2021',
  'MM/yyyy': '03/2021',
  'yyyy-MM': '2021-03',
  yyyy: '2021 (year only)',
}

const YEAR = /^(\d{4})$/
const ISO = /^(\d{4})[-/](\d{1,2})$/
const SLASHED = /^(\d{1,2})[-/](\d{4})$/
const NAMED = /^([a-z]{3,9})\.?\s+(\d{4})$/i

function monthFromName(name: string): number | undefined {
  const n = name.toLowerCase()
  const i = MONTHS.findIndex((m) => m.toLowerCase().startsWith(n))
  return i < 0 ? undefined : i + 1
}

/** `null` when the text isn't a date at all ("Present", "Summer 2020"). */
export function parseDate(raw: string): PartialDate | null {
  const s = raw.trim()
  if (!s) return null

  let m = s.match(YEAR)
  if (m) return { year: Number(m[1]) }

  m = s.match(ISO)
  if (m) return validate(Number(m[1]), Number(m[2]))

  m = s.match(SLASHED)
  if (m) return validate(Number(m[2]), Number(m[1]))

  m = s.match(NAMED)
  if (m) {
    const month = monthFromName(m[1])
    return month ? { year: Number(m[2]), month } : null
  }
  return null
}

function validate(year: number, month: number): PartialDate | null {
  return month >= 1 && month <= 12 ? { year, month } : null
}

/** How a picked date is stored: `2021-03`, or `2021` for a year-only pick. */
export function toCanonical(d: PartialDate): string {
  if (!d.month) return String(d.year)
  return `${d.year}-${String(d.month).padStart(2, '0')}`
}

/**
 * Render a stored date in the theme's format. Unparseable text (and the empty
 * string) is returned untouched, so "Present" and "Q3 2019" still work.
 */
export function formatDate(raw: string, format: DateFormat): string {
  const d = parseDate(raw)
  if (!d) return raw.trim()
  // A year-only date has no month to show, whatever the format asks for.
  if (!d.month || format === 'yyyy') return String(d.year)

  const mm = String(d.month).padStart(2, '0')
  const name = MONTHS[d.month - 1]
  switch (format) {
    case 'MMMM yyyy':
      return `${name} ${d.year}`
    case 'MM/yyyy':
      return `${mm}/${d.year}`
    case 'yyyy-MM':
      return `${d.year}-${mm}`
    case 'MMM yyyy':
    default:
      return `${name.slice(0, 3)} ${d.year}`
  }
}
