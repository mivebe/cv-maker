import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Settings2,
  SquareSplitVertical,
} from 'lucide-react'
import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  defaultPlacement,
  reconcileSectionOrder,
  sectionById,
  sectionLabel,
} from '../../lib/sections'
import { useHighlightNode } from './highlight'
import { PartialOptionsFields } from './VariantOptionsEditor'

const COLUMNS = [
  { label: 'Main', value: 'main' as const },
  { label: 'Side', value: 'side' as const },
  { label: 'Full', value: 'full' as const },
]

export function SectionOrderEditor({ variant }: { variant: CVVariant }) {
  const profile = useStore((s) => s.profile)
  const moveVariantSection = useStore((s) => s.moveVariantSection)
  const toggleSectionHidden = useStore((s) => s.toggleSectionHidden)
  const setSectionPlacement = useStore((s) => s.setSectionPlacement)
  const setSectionTitle = useStore((s) => s.setSectionTitle)
  const setVariantSectionOptions = useStore((s) => s.setVariantSectionOptions)
  const clearVariantSectionOption = useStore(
    (s) => s.clearVariantSectionOption,
  )
  const [optionsFor, setOptionsFor] = useState<string | null>(null)

  const hl = useHighlightNode()

  const order = reconcileSectionOrder(variant.sectionOrder, profile)
  const hidden = new Set(variant.hiddenSections)
  const twoCol = variant.theme.columns === 2

  return (
    <SectionCard
      title="Sections"
      description={
        twoCol
          ? 'Reorder sections, place them in a column, and start a new page where you want one. Hidden sections stay in the master.'
          : 'Reorder and show/hide sections. Column placement applies to two-column themes only.'
      }
    >
      <ul className="divide-y">
        {order.map((id, i) => {
          const section = sectionById(profile, id)
          if (!section) return null
          const label = sectionLabel(section)
          const isHidden = hidden.has(id)
          const placement =
            variant.sectionLayout[id] ?? defaultPlacement(profile, id)
          const overrides = variant.sectionOptions[id] ?? {}
          const hasOverrides = Object.keys(overrides).length > 0
          const showOptions = optionsFor === id

          return (
            <li key={id} className="space-y-2 rounded-md px-1 py-3" {...hl(id)}>
              <div className="flex items-center gap-1 sm:gap-2">
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
                  onChange={(e) =>
                    setSectionTitle(variant.id, id, e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={isHidden ? 'Show section' : 'Hide section'}
                  onClick={() => toggleSectionHidden(variant.id, id)}
                >
                  {isHidden ? <Eye /> : <EyeOff />}
                  <span className="hidden sm:inline">
                    {isHidden ? 'Show' : 'Hide'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveVariantSection(variant.id, id, 'up')}
                  disabled={i === 0}
                  aria-label="Move up"
                  title="Move up"
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveVariantSection(variant.id, id, 'down')}
                  disabled={i === order.length - 1}
                  aria-label="Move down"
                  title="Move down"
                >
                  <ChevronDown />
                </Button>
              </div>

              {!isHidden && (
                <div className="flex flex-wrap items-center gap-1.5 pl-1">
                  {twoCol &&
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
                    ))}
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
                  <Button
                    size="sm"
                    variant={
                      showOptions || hasOverrides ? 'secondary' : 'ghost'
                    }
                    className="h-7 gap-1.5 px-2 text-xs"
                    title="Per-section option overrides (beat the variant's policy)"
                    onClick={() => setOptionsFor(showOptions ? null : id)}
                  >
                    <Settings2 className="size-3.5" />
                    Options
                    {hasOverrides && ` (${Object.keys(overrides).length})`}
                  </Button>
                </div>
              )}

              {!isHidden && showOptions && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Overrides for this section only, in this variant only. They
                    win over the section's own settings AND the variant's
                    policy.
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
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
