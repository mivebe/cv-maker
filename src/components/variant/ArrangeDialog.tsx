import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { GripVertical, LayoutPanelTop, Lock } from 'lucide-react'
import type { CVVariant } from '../../schema'
import type { ResolvedCV } from '../../lib/resolve'
import { reconcileSectionOrder } from '../../lib/sections'
import { useStore } from '../../store/useStore'
import { measurePageFit, PAGE_WIDTH_PX, PAGE_HEIGHT_PX } from '../../cv/pagefit'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * "Rearrange" - a miniature of the CV where sections are boxes you drag among
 * each other, between columns and across pages.
 *
 * The miniature is measured, not approximated: sheet cuts come from the same
 * pagefit prediction the live preview draws, and every box's height is its
 * section's real rendered height scaled down - so the mini pages are exactly
 * proportional to the live preview.
 *
 * Dropping writes straight to the variant (order, column placement, page
 * break); the measurement then re-runs off the updated preview, so the
 * miniature always shows the layout that will actually print. Page rule, as
 * agreed: dropping a section at the very top of page N pins a page break to
 * it (taking the flag over from the section that started the page); dropping
 * anywhere else clears the section's own break and lets it flow.
 */

const MINI_W = 264
const K = MINI_W / PAGE_WIDTH_PX
const MINI_H = Math.round(PAGE_HEIGHT_PX * K)
/** Below this a box's label is unreadable; proportionality yields to legibility. */
const MIN_BOX = 18

interface Measured {
  /** Sheet-start Y offsets (unscaled px from the document top), sorted. */
  starts: number[]
  marginPx: number
  headerH: number
  sections: Map<string, { top: number; height: number }>
}

/** All geometry the miniature needs, read from the live preview's DOM. */
function measure(root: HTMLElement, marginMm: number): Measured {
  const fit = measurePageFit(root, marginMm)
  const base = root.getBoundingClientRect()
  const scale = root.offsetWidth ? base.width / root.offsetWidth : 1
  const top = (el: Element) =>
    (el.getBoundingClientRect().top - base.top) / scale

  // Explicit sheet starts (.cv-page blocks) plus the predicted natural cuts.
  const pageTops = Array.from(root.querySelectorAll('.cv-page')).map(top)
  const starts = [...pageTops, ...fit.breaks].sort((a, b) => a - b)

  const header = root.querySelector('.cv-header')
  const headerH = header ? header.getBoundingClientRect().height / scale : 0

  const sections = new Map<string, { top: number; height: number }>()
  for (const el of root.querySelectorAll<HTMLElement>(
    '.cv-section[data-hl-id]',
  )) {
    sections.set(el.getAttribute('data-hl-id') as string, {
      top: top(el),
      height: el.getBoundingClientRect().height / scale,
    })
  }
  return { starts, marginPx: fit.marginPx, headerH, sections }
}

/** Which sheet a document Y offset stands on. */
function pageOfY(starts: number[], y: number): number {
  let p = 0
  for (let i = 0; i < starts.length; i++) if (starts[i] <= y + 1) p = i
  return p
}

interface MiniSec {
  id: string
  label: string
  column: 'main' | 'side' | 'full'
  /** Mini box height in px, already scaled. */
  h: number
}

type MiniBand =
  | { kind: 'full'; sec: MiniSec }
  | { kind: 'cols'; main: MiniSec[]; side: MiniSec[] }

interface MiniPage {
  bands: MiniBand[]
}

/** Group the visible sections into pages and bands, mirroring cv/layout.ts. */
function buildPages(cv: ResolvedCV, m: Measured, twoCol: boolean): MiniPage[] {
  const pages: MiniPage[] = Array.from(
    { length: Math.max(1, m.starts.length) },
    () => ({ bands: [] }),
  )
  for (const sec of cv.sections) {
    const geo = m.sections.get(sec.id)
    const p = geo ? pageOfY(m.starts, geo.top) : 0
    const mini: MiniSec = {
      id: sec.id,
      label: sec.label,
      column: sec.column,
      h: Math.max((geo?.height ?? 40) * K, MIN_BOX),
    }
    const bands = pages[p].bands
    const last = bands[bands.length - 1]
    if (!twoCol || sec.column === 'full') {
      bands.push({ kind: 'full', sec: mini })
    } else if (last && last.kind === 'cols') {
      last[sec.column === 'side' ? 'side' : 'main'].push(mini)
    } else {
      bands.push({
        kind: 'cols',
        main: sec.column === 'side' ? [] : [mini],
        side: sec.column === 'side' ? [mini] : [],
      })
    }
  }
  return pages
}

type DropTarget =
  | { type: 'section'; id: string; pos: 'before' | 'after' }
  | { type: 'column'; page: number; band: number; column: 'main' | 'side' }
  | { type: 'newpage' }

function DropLine({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 h-[3px] rounded-full bg-primary',
        className,
      )}
    />
  )
}

function MiniBox({ sec, target }: { sec: MiniSec; target: DropTarget | null }) {
  const {
    setNodeRef: setDrag,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({ id: sec.id })
  const { setNodeRef: setDrop } = useDroppable({ id: `sec:${sec.id}` })
  const hit =
    target?.type === 'section' && target.id === sec.id ? target.pos : null

  return (
    <div className="relative" style={{ height: sec.h }}>
      {hit === 'before' && <DropLine className="-top-1" />}
      <div
        ref={(n) => {
          setDrag(n)
          setDrop(n)
        }}
        {...listeners}
        {...attributes}
        className={cn(
          'flex h-full w-full cursor-grab touch-none items-center gap-1 overflow-hidden rounded-sm border border-primary/25 bg-primary/10 px-1.5 text-[11px] leading-tight text-foreground/80',
          isDragging && 'opacity-40',
        )}
      >
        <GripVertical className="size-3 shrink-0 opacity-50" />
        <span className="min-w-0 flex-1 truncate text-center">{sec.label}</span>
      </div>
      {hit === 'after' && <DropLine className="-bottom-1" />}
    </div>
  )
}

function MiniColumn({
  page,
  band,
  column,
  secs,
  widthPct,
  target,
}: {
  page: number
  band: number
  column: 'main' | 'side'
  secs: MiniSec[]
  widthPct: number
  target: DropTarget | null
}) {
  const { setNodeRef } = useDroppable({ id: `col:${page}:${band}:${column}` })
  const hit =
    target?.type === 'column' &&
    target.page === page &&
    target.band === band &&
    target.column === column

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-6 flex-col gap-1 rounded-sm',
        hit && 'ring-2 ring-primary',
        secs.length === 0 && 'border border-dashed border-muted-foreground/30',
      )}
      style={{ width: `${widthPct}%` }}
    >
      {secs.map((s) => (
        <MiniBox key={s.id} sec={s} target={target} />
      ))}
    </div>
  )
}

function NewPageZone({ highlighted }: { highlighted: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'newpage' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 p-2 text-center text-xs text-muted-foreground',
        highlighted && 'border-primary bg-primary/10 text-primary',
      )}
      style={{ width: MINI_W, height: MINI_H / 3 }}
    >
      Drop here to start
      <br />a new page
    </div>
  )
}

function ArrangeBoard({
  variant,
  cv,
  docRef,
}: {
  variant: CVVariant
  cv: ResolvedCV
  docRef: RefObject<HTMLDivElement | null>
}) {
  const profile = useStore((s) => s.profile)
  const setVariantSectionOrder = useStore((s) => s.setVariantSectionOrder)
  const setSectionPlacement = useStore((s) => s.setSectionPlacement)

  const [measured, setMeasured] = useState<Measured | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [target, setTarget] = useState<DropTarget | null>(null)
  // The drop applies from the last computed target; state alone could lag the
  // final mouse-up by one frame.
  const targetRef = useRef<DropTarget | null>(null)

  const twoCol = variant.theme.columns === 2

  // A passive effect, NOT a layout effect: CVPreview forwards the document
  // ref through an inline callback, so during the commit that follows a drop
  // the ref is detached (null) until CVPreview's own layout phase - which runs
  // after ours. By passive-effect time the ref is always attached again.
  useEffect(() => {
    const root = docRef.current
    if (!root) return
    const run = () => setMeasured(measure(root, variant.theme.pageMargin))
    run()
    // Late reflows (a brand glyph, the avatar) move the cuts after we've read.
    const ro = new ResizeObserver(run)
    ro.observe(root)
    return () => ro.disconnect()
  }, [docRef, cv, variant.theme])

  const pages = useMemo(
    () => (measured ? buildPages(cv, measured, twoCol) : []),
    [cv, measured, twoCol],
  )
  const miniById = useMemo(() => {
    const map = new Map<string, MiniSec>()
    for (const page of pages)
      for (const band of page.bands) {
        if (band.kind === 'full') map.set(band.sec.id, band.sec)
        else for (const s of [...band.main, ...band.side]) map.set(s.id, s)
      }
    return map
  }, [pages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  // Prefer a section box under the pointer over the zone that contains it,
  // and never target the dragged section's own box.
  const collide: CollisionDetection = (args) => {
    const self = `sec:${String(args.active.id)}`
    const within = pointerWithin(args).filter((c) => c.id !== self)
    const boxes = within.filter((c) => String(c.id).startsWith('sec:'))
    if (boxes.length) return boxes
    if (within.length) return within
    return rectIntersection(args).filter((c) => c.id !== self)
  }

  const resolveTarget = ({
    active,
    over,
  }: DragMoveEvent): DropTarget | null => {
    if (!over) return null
    const oid = String(over.id)
    if (oid === 'newpage') return { type: 'newpage' }
    if (oid.startsWith('col:')) {
      const [, p, b, c] = oid.split(':')
      return {
        type: 'column',
        page: Number(p),
        band: Number(b),
        column: c as 'main' | 'side',
      }
    }
    if (oid.startsWith('sec:')) {
      const id = oid.slice(4)
      if (id === String(active.id)) return null
      const rect = over.rect
      const dragged = active.rect.current.translated
      const y = dragged ? dragged.top + dragged.height / 2 : rect.top
      return {
        type: 'section',
        id,
        pos: y < rect.top + rect.height / 2 ? 'before' : 'after',
      }
    }
    return null
  }

  const onDragStart = ({ active }: DragStartEvent) =>
    setActiveId(String(active.id))
  const onDragMove = (e: DragMoveEvent) => {
    const t = resolveTarget(e)
    targetRef.current = t
    setTarget(t)
  }
  const reset = () => {
    setActiveId(null)
    setTarget(null)
    targetRef.current = null
  }

  const onDragEnd = ({ active }: DragEndEvent) => {
    const t = targetRef.current
    const id = String(active.id)
    reset()
    if (!t || !measured) return

    const visible = cv.sections.map((s) => s.id)
    const pageOf = (sid: string) => {
      const geo = measured.sections.get(sid)
      return geo ? pageOfY(measured.starts, geo.top) : 0
    }
    const fullOrder = reconcileSectionOrder(variant.sectionOrder, profile)
    const without = fullOrder.filter((x) => x !== id)

    /** Insert after this id (null = the very start of the order). */
    let insertAfter: string | null = without[without.length - 1] ?? null
    let newColumn: 'main' | 'side' | null = null
    let newBreak = false
    let takeBreakFrom: string | null = null

    if (t.type === 'section') {
      const targetSec = cv.sections.find((s) => s.id === t.id)
      if (!targetSec) return
      if (targetSec.column !== 'full') newColumn = targetSec.column
      const idx = without.indexOf(t.id)
      insertAfter = t.pos === 'after' ? t.id : idx > 0 ? without[idx - 1] : null
      // Dropped at the very top of a later page: the page now starts with the
      // dragged section, so the break flag moves onto it.
      const p = pageOf(t.id)
      const firstOnPage = visible.find((v) => v !== id && pageOf(v) === p)
      if (p > 0 && t.pos === 'before' && firstOnPage === t.id) {
        newBreak = true
        if (targetSec.pageBreakBefore) takeBreakFrom = t.id
      }
    } else if (t.type === 'column') {
      newColumn = t.column
      const band = pages[t.page]?.bands[t.band]
      if (!band || band.kind !== 'cols') return
      // Keep it inside this band: insert after the band's last section.
      const bandIds = [...band.main, ...band.side]
        .map((s) => s.id)
        .filter((x) => x !== id)
      const order = new Map(visible.map((v, i) => [v, i]))
      bandIds.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
      const last = bandIds[bandIds.length - 1]
      if (last) insertAfter = last
    } else {
      // New page: to the end of the order, with an explicit break.
      newBreak = true
    }

    const at = insertAfter === null ? 0 : without.indexOf(insertAfter) + 1
    const newOrder = [...without.slice(0, at), id, ...without.slice(at)]
    setVariantSectionOrder(variant.id, newOrder)
    setSectionPlacement(variant.id, id, {
      ...(newColumn ? { column: newColumn } : {}),
      pageBreakBefore: newBreak,
    })
    if (takeBreakFrom)
      setSectionPlacement(variant.id, takeBreakFrom, {
        pageBreakBefore: false,
      })
  }

  if (!measured) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Measuring the live preview…
      </p>
    )
  }
  if (!cv.sections.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing to arrange - every section is hidden or empty.
      </p>
    )
  }

  const ratio = variant.theme.sideColumnRatio
  const mainPct = 100 / (1 + ratio)
  const sidePct = 100 - mainPct
  const pad = Math.max(measured.marginPx * K, 6)
  const activeSec = activeId ? miniById.get(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collide}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      <div className="flex flex-wrap items-start justify-center gap-6">
        {pages.map((page, p) => (
          <div key={p}>
            <div className="mb-1.5 text-center text-xs font-medium text-muted-foreground">
              Page {p + 1} of {pages.length}
            </div>
            <div
              className="rounded-md border bg-background shadow-sm"
              style={{ width: MINI_W, minHeight: MINI_H, padding: pad }}
            >
              <div className="flex flex-col gap-1">
                {p === 0 && measured.headerH > 0 && (
                  <div
                    className="flex items-center justify-center gap-1 rounded-sm border border-primary/25 bg-primary/20 text-[11px] text-foreground/70"
                    style={{ height: Math.max(measured.headerH * K, MIN_BOX) }}
                    title="The header always leads the first page"
                  >
                    <Lock className="size-3 shrink-0" />
                    Header
                  </div>
                )}
                {page.bands.map((band, b) =>
                  band.kind === 'full' ? (
                    <MiniBox key={band.sec.id} sec={band.sec} target={target} />
                  ) : (
                    <div key={b} className="flex items-start gap-1">
                      <MiniColumn
                        page={p}
                        band={b}
                        column="main"
                        secs={band.main}
                        widthPct={mainPct}
                        target={target}
                      />
                      <MiniColumn
                        page={p}
                        band={b}
                        column="side"
                        secs={band.side}
                        widthPct={sidePct}
                        target={target}
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="self-center">
          <NewPageZone highlighted={target?.type === 'newpage'} />
        </div>
      </div>
      {/* Portal to body: the overlay is position:fixed, and the dialog's
          centering transform would otherwise become its containing block,
          leaving the floating box hundreds of px away from the pointer. */}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeSec ? (
            <div
              className="flex cursor-grabbing items-center gap-1 overflow-hidden rounded-sm border border-primary/40 bg-primary/20 px-1.5 text-[11px] leading-tight shadow-lg"
              style={{ height: activeSec.h }}
            >
              <GripVertical className="size-3 shrink-0 opacity-50" />
              <span className="min-w-0 flex-1 truncate text-center">
                {activeSec.label}
              </span>
            </div>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}

export function ArrangeDialog({
  variant,
  cv,
  docRef,
}: {
  variant: CVVariant
  cv: ResolvedCV
  docRef: RefObject<HTMLDivElement | null>
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LayoutPanelTop />
          Rearrange
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Hold &amp; drag the boxes to rearrange the sections
          </DialogTitle>
          <DialogDescription>
            Pages, columns and box sizes mirror the live preview. Drop a section
            at the very top of a page to start that page with it; dragging it
            elsewhere lets it flow again.
          </DialogDescription>
        </DialogHeader>
        {open && <ArrangeBoard variant={variant} cv={cv} docRef={docRef} />}
        <DialogFooter>
          <DialogClose asChild>
            <Button>Continue editing</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
