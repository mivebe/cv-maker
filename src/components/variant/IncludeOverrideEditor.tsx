import { useState } from 'react'
import type {
  ChartItem,
  CVVariant,
  LanguageItem,
  Section,
  SkillGroup,
  TotalItem,
} from '../../schema'
import { LANGUAGE_STAGES, sectionLabel } from '../../lib/sections'
import { useStore } from '../../store/useStore'
import { SectionCard, EmptyHint } from '@/components/app-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { OverrideList, OverrideText } from './OverrideField'
import { useHighlightNode } from './highlight'

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

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function IncludeOverrideEditor({ variant }: { variant: CVVariant }) {
  const profile = useStore((s) => s.profile)
  const ov = variant.overrides

  const hasContent = profile.sections.some((s) => s.items.length > 0)

  return (
    <SectionCard
      title="Include & tailor items"
      description="Uncheck items to drop them from this variant. Use “Tailor” to override wording without touching the master."
    >
      {!hasContent && (
        <EmptyHint>Add content in the Master Profile first.</EmptyHint>
      )}
      <div className="space-y-5">
        {profile.sections.map((sec) => {
          if (!sec.items.length) return null
          const title = sectionLabel(sec)

          if (sec.kind === 'experience') {
            return (
              <Group key={sec.id} title={title}>
                {sec.items.map((it) => (
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
              </Group>
            )
          }

          if (sec.kind === 'education') {
            return (
              <Group key={sec.id} title={title}>
                {sec.items.map((it) => (
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
              </Group>
            )
          }

          if (sec.kind === 'projects') {
            return (
              <Group key={sec.id} title={title}>
                {sec.items.map((it) => (
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
              </Group>
            )
          }

          if (sec.kind === 'items') {
            return (
              <Group key={sec.id} title={title}>
                {sec.items.map((it) => (
                  <ItemRow
                    key={it.id}
                    variant={variant}
                    itemId={it.id}
                    // An item can carry nothing but a chip group, in which case
                    // the group's legend is its name - fall back to it (and to
                    // the chips as the sub-line) rather than listing a column of
                    // identical "Untitled" rows nobody can tell apart.
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
              </Group>
            )
          }

          // Include-only kinds (skills, totals, chart, sliders, titleList,
          // languages): a checkbox row per item, nothing to tailor.
          return (
            <Group key={sec.id} title={title}>
              {sec.items.map((it) => (
                <ItemRow
                  key={it.id}
                  variant={variant}
                  itemId={it.id}
                  title={itemTitle(sec, it)}
                  subtitle={itemSubtitle(sec, it)}
                />
              ))}
            </Group>
          )
        })}
      </div>
    </SectionCard>
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
