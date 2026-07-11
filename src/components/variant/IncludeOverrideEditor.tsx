import { useState } from 'react'
import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { SectionCard, EmptyHint } from '@/components/app-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { OverrideList, OverrideText } from './OverrideField'

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
  const [open, setOpen] = useState(false)
  const included = variant.include[itemId] !== false
  const overridden =
    variant.overrides[itemId] &&
    Object.keys(variant.overrides[itemId]).length > 0

  return (
    <div className="rounded-md border">
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

  const hasContent =
    profile.experience.length ||
    profile.education.length ||
    profile.skills.length ||
    profile.projects.length ||
    profile.custom.some((s) => s.items.length)

  return (
    <SectionCard
      title="Include & tailor items"
      description="Uncheck items to drop them from this variant. Use “Tailor” to override wording without touching the master."
    >
      {!hasContent && (
        <EmptyHint>Add content in the Master Profile first.</EmptyHint>
      )}
      <div className="space-y-5">
        {profile.experience.length > 0 && (
          <Group title="Experience">
            {profile.experience.map((it) => (
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
        )}

        {profile.education.length > 0 && (
          <Group title="Education">
            {profile.education.map((it) => (
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
        )}

        {profile.skills.length > 0 && (
          <Group title="Skills">
            {profile.skills.map((g) => (
              <ItemRow
                key={g.id}
                variant={variant}
                itemId={g.id}
                title={g.name}
                subtitle={g.skills.join(', ')}
              />
            ))}
          </Group>
        )}

        {profile.projects.length > 0 && (
          <Group title="Projects">
            {profile.projects.map((it) => (
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
        )}

        {profile.custom.map(
          (sec) =>
            sec.items.length > 0 && (
              <Group key={sec.id} title={sec.title}>
                {sec.items.map((it) => (
                  <ItemRow
                    key={it.id}
                    variant={variant}
                    itemId={it.id}
                    title={it.title}
                    subtitle={it.subtitle}
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
            ),
        )}
      </div>
    </SectionCard>
  )
}
