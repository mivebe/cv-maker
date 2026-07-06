import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { SectionCard } from '../ui'
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
      <ul className="divide-y divide-slate-100">
        {order.map((key, i) => {
          const isHidden = hidden.has(key)
          return (
            <li
              key={key}
              className="flex items-center gap-3 py-2"
            >
              <span
                className={`flex-1 text-sm font-medium ${
                  isHidden ? 'text-slate-300 line-through' : 'text-slate-700'
                }`}
              >
                {sectionLabel(key, profile)}
              </span>
              <button
                onClick={() => toggleSectionHidden(variant.id, key)}
                className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                {isHidden ? 'Show' : 'Hide'}
              </button>
              <button
                onClick={() => moveVariantSection(variant.id, key, 'up')}
                disabled={i === 0}
                title="Move up"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => moveVariantSection(variant.id, key, 'down')}
                disabled={i === order.length - 1}
                title="Move down"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              >
                ↓
              </button>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
