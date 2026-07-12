import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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
  sectionLabel,
} from '../../lib/sections'

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
        {order.map((key, i) => {
          const isHidden = hidden.has(key)
          const placement = variant.sectionLayout[key] ?? defaultPlacement(key)

          return (
            <li key={key} className="space-y-2 py-3">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* The heading text is per-variant: "Portfolios" for a human,
                    "Projects" for a parser. Empty falls back to the default. */}
                <Input
                  className={cn(
                    'h-8 min-w-0 flex-1 text-sm font-medium',
                    isHidden && 'text-muted-foreground line-through',
                  )}
                  value={variant.sectionTitles[key] ?? ''}
                  placeholder={sectionLabel(key, profile)}
                  aria-label={`Heading for ${sectionLabel(key, profile)}`}
                  onChange={(e) =>
                    setSectionTitle(variant.id, key, e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  aria-label={isHidden ? 'Show section' : 'Hide section'}
                  onClick={() => toggleSectionHidden(variant.id, key)}
                >
                  {isHidden ? <Eye /> : <EyeOff />}
                  <span className="hidden sm:inline">
                    {isHidden ? 'Show' : 'Hide'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveVariantSection(variant.id, key, 'up')}
                  disabled={i === 0}
                  aria-label="Move up"
                  title="Move up"
                >
                  <ChevronUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveVariantSection(variant.id, key, 'down')}
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
                          setSectionPlacement(variant.id, key, {
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
                      setSectionPlacement(variant.id, key, {
                        pageBreakBefore: !placement.pageBreakBefore,
                      })
                    }
                  >
                    <SquareSplitVertical className="size-3.5" />
                    Page break
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
