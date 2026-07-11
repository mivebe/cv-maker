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
            <li key={key} className="flex items-center gap-3 py-2">
              <span
                className={cn(
                  'flex-1 text-sm font-medium',
                  isHidden && 'text-muted-foreground line-through',
                )}
              >
                {sectionLabel(key, profile)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSectionHidden(variant.id, key)}
              >
                {isHidden ? <Eye /> : <EyeOff />}
                {isHidden ? 'Show' : 'Hide'}
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
