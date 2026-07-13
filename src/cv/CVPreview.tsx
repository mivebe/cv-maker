import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { AlertTriangle } from 'lucide-react'
import type { ThemeConfig } from '../schema'
import type { ResolvedCV } from '../lib/resolve'
import { CVDocument } from './CVDocument'
import {
  measurePageFit,
  trimToFit,
  PAGE_WIDTH_PX,
  type PageFit,
} from './pagefit'

/**
 * Live preview: renders the CV document at natural page size and scales it
 * down with a CSS transform so a full page fits the available width. The inner
 * document ref is forwarded untouched so print/export targets the real,
 * unscaled element.
 *
 * The preview is one continuous block, not a stack of sheets, so it also draws
 * the sheet boundaries the print pipeline will cut on (see pagefit.ts) and says
 * how many pages that adds up to. A CV that quietly grew a third page is the
 * whole failure mode this is here to make visible.
 */
export const CVPreview = forwardRef<
  HTMLDivElement,
  { cv: ResolvedCV; theme: ThemeConfig }
>(function CVPreview({ cv, theme }, docRef) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pageHeight, setPageHeight] = useState<number | null>(null)
  const [fit, setFit] = useState<PageFit | null>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const recompute = () => {
      const avail = el.clientWidth
      setScale(Math.min(1, avail / PAGE_WIDTH_PX))
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const measure = useCallback(() => {
    if (innerRef.current) {
      setPageHeight(innerRef.current.offsetHeight * scale)
    }
    if (rootRef.current) {
      setFit(measurePageFit(rootRef.current, theme.pageMargin))
    }
  }, [scale, theme.pageMargin])

  // Re-measure on every content/theme change, and again whenever the document's
  // own height moves under us - a brand glyph or the avatar landing late reflows
  // the page after this effect has already run.
  useEffect(() => {
    measure()
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, cv, theme])

  const pages = fit?.pages ?? 1
  const over = pages > 2
  const trim = fit ? trimToFit(fit, 2) : 0

  return (
    <div className="space-y-2">
      <div className="no-print flex flex-wrap items-center gap-2 text-xs">
        <span
          className={
            over
              ? 'rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-400'
              : 'rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground'
          }
        >
          {pages} {pages === 1 ? 'page' : 'pages'}
        </span>
        {over && (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            Over two pages — trim about {trim.toFixed(1)} in of content, or
            tighten density, margins and font size.
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        // The backdrop the page sits on. It darkens with the app, but the page
        // itself stays white in both modes - it is paper, and it prints as paper.
        className="w-full overflow-auto rounded-lg bg-slate-200 p-2 sm:p-4 dark:bg-slate-900"
      >
        <div style={{ height: pageHeight ?? undefined }}>
          <div
            ref={innerRef}
            className="relative"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: PAGE_WIDTH_PX,
            }}
          >
            <CVDocument
              ref={(el) => {
                rootRef.current = el
                if (typeof docRef === 'function') docRef(el)
                else if (docRef) docRef.current = el
              }}
              cv={cv}
              theme={theme}
            />
            {/* Sibling of the document, not a child: the ref above is what
                react-to-print clones, and the guides must not print. */}
            {fit && <SheetCuts fit={fit} />}
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * The line where a sheet ends, plus the blank gutter that follows it: at a real
 * page break the reader loses the bottom margin of one sheet and the top margin
 * of the next, and that band is dead space the continuous preview cannot show.
 */
function SheetCuts({ fit }: { fit: PageFit }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {fit.breaks.map((y, i) => (
        <div key={i} className="absolute inset-x-0" style={{ top: y }}>
          <div className="border-t-2 border-dashed border-rose-500/70" />
          <div
            style={{
              height: fit.marginPx * 2,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(244,63,94,0.10) 0 6px, transparent 6px 12px)',
            }}
          />
          <span className="absolute right-2 top-1 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            Page {i + 2}
          </span>
        </div>
      ))}
    </div>
  )
}
