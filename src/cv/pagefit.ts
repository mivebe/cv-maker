/**
 * Predicts where the print pipeline will cut the document into sheets.
 *
 * The preview renders the CV as one continuous block, so without this the only
 * way to find out that a CV spilled onto a third page is to open the print
 * dialog. Here we measure the laid-out DOM and re-run, cheaply, the same
 * fragmentation the browser does: walk down a sheet's worth of content at a
 * time, and pull the cut upwards whenever it would land inside a box that
 * cv.css marks unbreakable.
 *
 * It is a prediction, not a contract - the browser owns the real break - but it
 * models the rules that actually move a break (unbreakable boxes) and so lands
 * on the same line in practice.
 */

/** US Letter at 96dpi, and the CSS px in one millimetre. */
export const PAGE_WIDTH_PX = 8.5 * 96
export const PAGE_HEIGHT_PX = 11 * 96
export const MM_PX = 96 / 25.4

/** The boxes cv.css refuses to cut, or refuses to be cut away from what follows. */
const ATOMS = [
  '.cv-chipgroup',
  '.cv-totals',
  '.cv-bullets li',
  '.cv-section-title',
  '.cv-item-title',
  '.cv-item-org',
  '.cv-meta-row',
].join(', ')

export interface PageFit {
  /** Y offsets, in unscaled px from the document top, where a sheet ends. */
  breaks: number[]
  /** Total sheets the document will print on. */
  pages: number
  /** Height of the content standing on the last sheet, in px. */
  lastFill: number
  /** Printable height of one sheet, in px. */
  usable: number
  /** The theme's page margin in px - the blank gutter at each break. */
  marginPx: number
}

/**
 * `root` is the `.cv-root` element. It may be rendered under a CSS scale
 * transform (the preview shrinks the page to fit), so every measurement is
 * divided back out to document px.
 */
export function measurePageFit(root: HTMLElement, marginMm: number): PageFit {
  const marginPx = marginMm * MM_PX
  const usable = Math.max(96, PAGE_HEIGHT_PX - 2 * marginPx)
  const base = root.getBoundingClientRect()
  const scale = root.offsetWidth ? base.width / root.offsetWidth : 1
  const top = (el: Element) =>
    (el.getBoundingClientRect().top - base.top) / scale
  const bottom = (el: Element) =>
    (el.getBoundingClientRect().bottom - base.top) / scale

  const breaks: number[] = []
  let pages = 0
  let lastFill = 0

  // Each `.cv-page` is an explicit sheet start (a section with pageBreakBefore),
  // so page-fit is computed per block and the sheet counts add up.
  for (const page of root.querySelectorAll<HTMLElement>('.cv-page')) {
    const kids = Array.from(page.children)
    // Not the element's own height: `.cv-page` has a min-height of a full sheet
    // on screen, so a half-empty page would measure as a full one.
    const start = top(page) + marginPx
    const end = kids.length ? Math.max(...kids.map(bottom)) : start
    const atoms = Array.from(page.querySelectorAll(ATOMS)).map(
      (el) => [top(el), bottom(el)] as const,
    )

    let cursor = start
    let sheets = 1
    // The bound is a runaway guard, not a supported page count.
    while (end - cursor > usable + 1 && sheets < 20) {
      let cut = cursor + usable
      for (const [atomTop, atomBottom] of atoms) {
        // Straddles the cut, and starts on this sheet: the box moves down whole.
        if (atomTop > cursor + 1 && atomTop < cut - 1 && atomBottom > cut + 1) {
          cut = Math.min(cut, atomTop)
        }
      }
      // A box taller than a whole sheet has to be cut; nothing else is possible.
      if (cut <= cursor + 1) cut = cursor + usable
      breaks.push(cut)
      cursor = cut
      sheets++
    }
    pages += sheets
    lastFill = end - cursor
  }

  return { breaks, pages, lastFill, usable, marginPx }
}

/**
 * How much content height, in inches, has to go for the CV to fit `target`
 * sheets: everything standing on the last sheet, plus every whole sheet between
 * it and the target.
 */
export function trimToFit(fit: PageFit, target = 2): number {
  if (fit.pages <= target) return 0
  return (fit.lastFill + fit.usable * (fit.pages - target - 1)) / 96
}
