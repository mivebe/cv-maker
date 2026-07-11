import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { reconcileSectionOrder, sectionLabel } from '../../lib/sections'

export function SectionOrderEditor({ variant }: { variant: CVVariant }) {
  const profile = useStore((s) => s.profile)
  const moveVariantSection = useStore((s) => s.moveVariantSection)
  const toggleSectionHidden = useStore((s) => s.toggleSectionHidden)

  const order = reconcileSectionOrder(variant.sectionOrder, profile)
  const hidden = new Set(variant.hiddenSections)

  return (
    <SectionCard
      title="Sections"
      description="Reorder and show/hide sections for this variant. Hidden sections stay in the master."
    >
      <ul className="divide-y">
        {order.map((key, i) => {
          const isHidden = hidden.has(key)
          return (
            <li key={key} className="flex items-center gap-1 py-2 sm:gap-2">
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-sm font-medium',
                  isHidden && 'text-muted-foreground line-through',
                )}
              >
                {sectionLabel(key, profile)}
              </span>
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
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
