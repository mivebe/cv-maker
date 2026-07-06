import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ThemeConfig } from '../schema'
import type { ResolvedCV } from '../lib/resolve'
import { CVDocument } from './CVDocument'

/** Page width in CSS pixels (8.5in at 96dpi). */
const PAGE_WIDTH_PX = 8.5 * 96

/**
 * Live preview: renders the CV document at natural page size and scales it
 * down with a CSS transform so a full page fits the available width. The inner
 * document ref is forwarded untouched so print/export targets the real,
 * unscaled element.
 */
export const CVPreview = forwardRef<
  HTMLDivElement,
  { cv: ResolvedCV; theme: ThemeConfig }
>(function CVPreview({ cv, theme }, docRef) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pageHeight, setPageHeight] = useState<number | null>(null)
  const innerRef = useRef<HTMLDivElement>(null)

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

  // Reserve layout height for the scaled document so the scroll area is correct.
  useEffect(() => {
    if (innerRef.current) {
      setPageHeight(innerRef.current.offsetHeight * scale)
    }
  }, [scale, cv, theme])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto rounded-lg bg-slate-200 p-4"
    >
      <div style={{ height: pageHeight ?? undefined }}>
        <div
          ref={innerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: PAGE_WIDTH_PX,
            boxShadow: '0 1px 8px rgba(0,0,0,0.15)',
          }}
        >
          <CVDocument ref={docRef} cv={cv} theme={theme} />
        </div>
      </div>
    </div>
  )
})
