import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Eye,
  EyeOff,
  SquareSplitVertical,
} from 'lucide-react'
import type { CVVariant, Section } from '../../schema'
import { useStore } from '../../store/useStore'
import { useReorderMode } from '../../store/useReorderMode'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  KIND_LABELS,
  KIND_PLACEMENT,
  reconcileSectionOrder,
  sectionById,
  sectionLabel,
} from '../../lib/sections'
import { useHighlightNode } from './highlight'
import { PartialOptionsFields } from './VariantOptionsEditor'
import { SectionItemsEditor } from './SectionItemsEditor'

/**
 * The Content tab's section list: one expandable card per section holding
 * EVERYTHING about that section in this variant - heading, visibility, column
 * placement, page break, per-section style overrides, and the item
 * include/tailor list. Cards reorder like any list (arrows or drag), and the
 * card order IS the variant's section order.
 */

const COLUMNS = [
  { label: 'Main', value: 'main' as const },
  { label: 'Side', value: 'side' as const },
  { label: 'Full', value: 'full' as const },
]

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  )
}

function VariantSectionCard({
  variant,
  section,
  index,
  total,
}: {
  variant: CVVariant
  section: Section
  index: number
  total: number
}) {
  const moveVariantSection = useStore((s) => s.moveVariantSection)
  const toggleSectionHidden = useStore((s) => s.toggleSectionHidden)
  const setSectionPlacement = useStore((s) => s.setSectionPlacement)
  const setSectionTitle = useStore((s) => s.setSectionTitle)
  const setVariantSectionOptions = useStore((s) => s.setVariantSectionOptions)
  const clearVariantSectionOption = useStore((s) => s.clearVariantSectionOption)
  const mode = useReorderMode((s) => s.mode)
  const hl = useHighlightNode()
  const [open, setOpen] = useState(false)

  const id = section.id
  const label = sectionLabel(section)
  const isHidden = variant.hiddenSections.includes(id)
  const placement = variant.sectionLayout[id] ?? KIND_PLACEMENT[section.kind]
  const overrides = variant.sectionOptions[id] ?? {}
  const overrideCount = Object.keys(overrides).length
  const twoCol = variant.theme.columns === 2

  return (
    <div className="rounded-lg border bg-card" {...hl(id)}>
      <div className="flex items-center gap-1 p-2 sm:gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-expanded={open}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <ChevronDown /> : <ChevronRight />}
        </Button>
        {/* The heading text is per-variant: "Portfolios" for a human,
            "Projects" for a parser. Empty falls back to the default. */}
        <Input
          className={cn(
            'h-8 min-w-0 flex-1 text-sm font-medium',
            isHidden && 'text-muted-foreground line-through',
          )}
          value={variant.sectionTitles[id] ?? ''}
          placeholder={label}
          aria-label={`Heading for ${label}`}
          onChange={(e) => setSectionTitle(variant.id, id, e.target.value)}
        />
        <Badge
          variant="outline"
          className="hidden shrink-0 text-muted-foreground sm:inline-flex"
        >
          {KIND_LABELS[section.kind]}
        </Badge>
        {overrideCount > 0 && !open && (
          <Badge variant="secondary" className="shrink-0">
            {overrideCount}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          aria-label={isHidden ? 'Show section' : 'Hide section'}
          title={isHidden ? 'Show section' : 'Hide section'}
          onClick={() => toggleSectionHidden(variant.id, id)}
        >
          {isHidden ? <Eye /> : <EyeOff />}
        </Button>
        {mode === 'arrows' && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveVariantSection(variant.id, id, 'up')}
              disabled={index === 0}
              aria-label="Move up"
              title="Move up"
            >
              <ChevronUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveVariantSection(variant.id, id, 'down')}
              disabled={index === total - 1}
              aria-label="Move down"
              title="Move down"
            >
              <ChevronDown />
            </Button>
          </>
        )}
      </div>

      {open && (
        <div className="space-y-5 border-t p-3">
          {isHidden ? (
            <p className="text-sm text-muted-foreground">
              Hidden in this variant. The section and its content stay in the
              master profile.
            </p>
          ) : (
            <>
              <div>
                <SubHeading>Placement</SubHeading>
                <div className="flex flex-wrap items-center gap-1.5">
                  {twoCol ? (
                    COLUMNS.map((c) => (
                      <Button
                        key={c.value}
                        size="sm"
                        variant={
                          placement.column === c.value ? 'secondary' : 'ghost'
                        }
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setSectionPlacement(variant.id, id, {
                            column: c.value,
                          })
                        }
                      >
                        {c.label}
                      </Button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Single-column theme - column placement applies to
                      two-column themes only.
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={placement.pageBreakBefore ? 'secondary' : 'ghost'}
                    className="h-7 gap-1.5 px-2 text-xs"
                    title="Start a new page before this section"
                    onClick={() =>
                      setSectionPlacement(variant.id, id, {
                        pageBreakBefore: !placement.pageBreakBefore,
                      })
                    }
                  >
                    <SquareSplitVertical className="size-3.5" />
                    Page break
                  </Button>
                </div>
              </div>

              <div>
                <SubHeading>
                  Style overrides
                  {overrideCount > 0 && ` (${overrideCount})`}
                </SubHeading>
                <p className="mb-3 text-xs text-muted-foreground">
                  For this section only, in this variant only. They win over the
                  section's own settings AND the variant's policy (Design tab).
                </p>
                <PartialOptionsFields
                  value={overrides}
                  inheritLabel="No override"
                  set={(patch) =>
                    setVariantSectionOptions(variant.id, id, patch)
                  }
                  clear={(key) =>
                    clearVariantSectionOption(variant.id, id, key)
                  }
                />
              </div>

              {/* A banner is heading-only by definition; there are no items. */}
              {section.kind !== 'banner' && (
                <div>
                  <SubHeading>Items</SubHeading>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Uncheck items to drop them from this variant. "Tailor"
                    overrides wording without touching the master.
                  </p>
                  <SectionItemsEditor variant={variant} section={section} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function VariantSectionsEditor({ variant }: { variant: CVVariant }) {
  const profile = useStore((s) => s.profile)
  const setVariantSectionOrder = useStore((s) => s.setVariantSectionOrder)

  const order = reconcileSectionOrder(variant.sectionOrder, profile)
  const twoCol = variant.theme.columns === 2

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold">Sections</h2>
        <p className="text-sm text-muted-foreground">
          Everything about a section lives in its card: heading, visibility,
          placement{twoCol ? ', column' : ''}, style overrides and items. The
          card order is the CV's section order.
        </p>
      </div>
      <SortableList
        ids={order}
        onReorder={(ids) => setVariantSectionOrder(variant.id, ids)}
        className="space-y-3"
      >
        {order.map((id, i) => {
          const section = sectionById(profile, id)
          if (!section) return null
          return (
            <SortableItem key={id} id={id}>
              <VariantSectionCard
                variant={variant}
                section={section}
                index={i}
                total={order.length}
              />
            </SortableItem>
          )
        })}
      </SortableList>
    </section>
  )
}
