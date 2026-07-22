import { useState } from 'react'
import type {
  ChartItem,
  CVVariant,
  LanguageItem,
  Section,
  SkillGroup,
  TotalItem,
} from '../../schema'
import { LANGUAGE_STAGES } from '../../lib/sections'
import { useStore } from '../../store/useStore'
import { EmptyHint } from '@/components/app-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { OverrideList, OverrideText } from './OverrideField'
import { useHighlightNode } from './highlight'
import { isItemTailored } from './tailoring'

/**
 * One section's master items inside a variant: a checkbox per item to include
 * or drop it, and - for the text-heavy kinds - a "Tailor" panel that overrides
 * wording without touching the master. Lives inside the section's card in the
 * Content tab, so everything about a section is in one place.
 */

/** A single toggleable master item with an expandable per-variant override panel. */
function ItemRow({
  variant,
  itemId,
  title,
  subtitle,
  children,
}: {
  variant: CVVariant
  itemId: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  const setVariantInclude = useStore((s) => s.setVariantInclude)
  const hl = useHighlightNode()
  const [open, setOpen] = useState(false)
  const included = variant.include[itemId] !== false
  const overridden =
    variant.overrides[itemId] &&
    Object.keys(variant.overrides[itemId]).length > 0

  return (
    <div className="rounded-md border" {...hl(itemId)}>
      <div className="flex items-center gap-2 px-3 py-2 sm:gap-3">
        <Checkbox
          className="shrink-0"
          checked={included}
          onCheckedChange={(v) =>
            setVariantInclude(variant.id, itemId, v === true)
          }
        />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-sm font-medium',
              !included && 'text-muted-foreground',
            )}
          >
            {title || 'Untitled'}
          </div>
          {subtitle && (
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
        {overridden && (
          <Badge variant="secondary" className="shrink-0">
            tailored
          </Badge>
        )}
        {children && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Tailor'}
          </Button>
        )}
      </div>
      {open && children && (
        <div className="space-y-3 border-t bg-muted/40 p-3">{children}</div>
      )}
    </div>
  )
}

export function SectionItemsEditor({
  variant,
  section,
  tailoredOnly = false,
}: {
  variant: CVVariant
  section: Section
  /** Show only items that are overridden or dropped in this variant. */
  tailoredOnly?: boolean
}) {
  const ov = variant.overrides
  const keep = (it: { id: string }) =>
    !tailoredOnly || isItemTailored(variant, it.id)

  if (!section.items.length) {
    return <EmptyHint>No items yet - add them in the Master Profile.</EmptyHint>
  }

  if (section.kind === 'experience') {
    return (
      <div className="space-y-2">
        {section.items.filter(keep).map((it) => (
          <ItemRow
            key={it.id}
            variant={variant}
            itemId={it.id}
            title={it.role}
            subtitle={it.organization}
          >
            <OverrideText
              variantId={variant.id}
              itemId={it.id}
              field="role"
              label="Role"
              masterValue={it.role}
              override={ov[it.id]}
              suggestionKind="role"
            />
            {/* Dates are tailorable too: an "explain the gap" variant amends a
                range without rewriting the master history. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <OverrideText
                variantId={variant.id}
                itemId={it.id}
                field="startDate"
                label="Start date"
                masterValue={it.startDate}
                override={ov[it.id]}
              />
              <OverrideText
                variantId={variant.id}
                itemId={it.id}
                field="endDate"
                label="End date"
                masterValue={it.current ? 'Present' : it.endDate}
                override={ov[it.id]}
              />
            </div>
            <OverrideText
              variantId={variant.id}
              itemId={it.id}
              field="summary"
              label="Summary"
              masterValue={it.summary}
              override={ov[it.id]}
              multiline
            />
            <OverrideList
              variantId={variant.id}
              itemId={it.id}
              field="highlights"
              label="Highlights"
              masterValue={it.highlights}
              override={ov[it.id]}
            />
          </ItemRow>
        ))}
      </div>
    )
  }

  if (section.kind === 'education') {
    return (
      <div className="space-y-2">
        {section.items.filter(keep).map((it) => (
          <ItemRow
            key={it.id}
            variant={variant}
            itemId={it.id}
            title={it.degree}
            subtitle={it.institution}
          >
            <OverrideText
              variantId={variant.id}
              itemId={it.id}
              field="details"
              label="Details"
              masterValue={it.details}
              override={ov[it.id]}
              multiline
            />
          </ItemRow>
        ))}
      </div>
    )
  }

  if (section.kind === 'projects') {
    return (
      <div className="space-y-2">
        {section.items.filter(keep).map((it) => (
          <ItemRow
            key={it.id}
            variant={variant}
            itemId={it.id}
            title={it.name}
            subtitle={it.description}
          >
            <OverrideText
              variantId={variant.id}
              itemId={it.id}
              field="description"
              label="Description"
              masterValue={it.description}
              override={ov[it.id]}
              multiline
            />
            <OverrideList
              variantId={variant.id}
              itemId={it.id}
              field="highlights"
              label="Highlights"
              masterValue={it.highlights}
              override={ov[it.id]}
            />
          </ItemRow>
        ))}
      </div>
    )
  }

  if (section.kind === 'items') {
    return (
      <div className="space-y-2">
        {section.items.filter(keep).map((it) => (
          <ItemRow
            key={it.id}
            variant={variant}
            itemId={it.id}
            // An item can carry nothing but a chip group, in which case the
            // group's legend is its name - fall back to it (and to the chips as
            // the sub-line) rather than listing a column of identical
            // "Untitled" rows nobody can tell apart.
            title={it.title || it.tagsLabel}
            subtitle={it.subtitle || it.tags.join(', ')}
          >
            <OverrideText
              variantId={variant.id}
              itemId={it.id}
              field="description"
              label="Description"
              masterValue={it.description}
              override={ov[it.id]}
              multiline
            />
            <OverrideList
              variantId={variant.id}
              itemId={it.id}
              field="highlights"
              label="Highlights"
              masterValue={it.highlights}
              override={ov[it.id]}
            />
          </ItemRow>
        ))}
      </div>
    )
  }

  // Include-only kinds (skills, totals, chart, sliders, titleList, languages):
  // a checkbox row per item, nothing to tailor.
  return (
    <div className="space-y-2">
      {section.items.filter(keep).map((it) => (
        <ItemRow
          key={it.id}
          variant={variant}
          itemId={it.id}
          title={itemTitle(section, it)}
          subtitle={itemSubtitle(section, it)}
        />
      ))}
    </div>
  )
}

/** Display name for an include-only row, per kind. */
function itemTitle(sec: Section, it: Section['items'][number]): string {
  if (sec.kind === 'skills') return (it as SkillGroup).name
  if (sec.kind === 'totals') return (it as TotalItem).label
  if (sec.kind === 'languages') return (it as LanguageItem).name
  return (it as { title?: string }).title ?? ''
}

function itemSubtitle(
  sec: Section,
  it: Section['items'][number],
): string | undefined {
  if (sec.kind === 'skills') return (it as SkillGroup).skills.join(', ')
  if (sec.kind === 'totals') return (it as TotalItem).value
  if (sec.kind === 'chart') return String((it as ChartItem).value)
  if (sec.kind === 'languages')
    return LANGUAGE_STAGES[
      Math.min(Math.max(1, (it as LanguageItem).level), 4) - 1
    ]
  return (it as { subtitle?: string }).subtitle || undefined
}
