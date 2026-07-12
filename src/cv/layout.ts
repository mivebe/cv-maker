import type { ResolvedSection } from '../lib/resolve'

/**
 * Turns a flat, ordered list of sections into printable pages.
 *
 * Two things the old single-stack renderer could not express, and the reference
 * layout needs: a section can span both columns (the TOTALS grid), and a section
 * can start a new sheet (the "Additional projects" page). So a page is a list of
 * *bands*: either a two-column band (sections flow down `main` and `side`
 * independently, which is what keeps the columns from tearing into rows) or a
 * single full-width block that closes the band before it.
 */

export interface ColumnsBand {
  kind: 'columns'
  main: ResolvedSection[]
  side: ResolvedSection[]
}

export interface FullBand {
  kind: 'full'
  section: ResolvedSection
}

export type Band = ColumnsBand | FullBand

export interface Page {
  bands: Band[]
}

export function paginate(
  sections: ResolvedSection[],
  twoColumn: boolean,
): Page[] {
  const pages: Page[] = []
  let bands: Band[] = []
  let open: ColumnsBand | null = null

  const flush = () => {
    if (open && (open.main.length || open.side.length)) bands.push(open)
    open = null
  }
  const endPage = () => {
    flush()
    if (bands.length) pages.push({ bands })
    bands = []
  }

  for (const section of sections) {
    if (section.pageBreakBefore) endPage()

    // In a single-column theme every section is full width, so the reading order
    // stays linear (this is also what makes the ATS preset parse cleanly).
    if (!twoColumn || section.column === 'full') {
      flush()
      bands.push({ kind: 'full', section })
      continue
    }

    if (!open) open = { kind: 'columns', main: [], side: [] }
    if (section.column === 'side') open.side.push(section)
    else open.main.push(section)
  }

  endPage()
  return pages
}
