import { useStore } from '../../store/useStore'
import { EmptyHint, Field } from '@/components/app-ui'
import { DateInput } from '@/components/DateInput'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { SuggestInput } from '@/components/SuggestInput'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function ExperienceEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'experience') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No experience yet.</EmptyHint>}
      <SortableList
        ids={items.map((it) => it.id)}
        onReorder={(ids) => setItemOrder(id, ids)}
        className="space-y-4"
      >
        {items.map((item, i) => (
          <SortableItem key={item.id} id={item.id}>
            <ItemFrame
              title={
                [item.role, item.organization].filter(Boolean).join(' · ') || ''
              }
              onUp={() => moveItem(id, item.id, 'up')}
              onDown={() => moveItem(id, item.id, 'down')}
              onRemove={() => removeItem(id, item.id)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role / title">
                  <SuggestInput
                    kind="role"
                    value={item.role}
                    onChange={(role) => updateItem(id, item.id, { role })}
                  />
                </Field>
                <Field label="Organization">
                  <SuggestInput
                    kind="organization"
                    value={item.organization}
                    onChange={(organization) =>
                      updateItem(id, item.id, { organization })
                    }
                  />
                </Field>
                <Field label="Location">
                  <SuggestInput
                    kind="location"
                    value={item.location}
                    onChange={(location) =>
                      updateItem(id, item.id, { location })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start">
                    <DateInput
                      value={item.startDate}
                      placeholder="2021-03"
                      onChange={(startDate) =>
                        updateItem(id, item.id, { startDate })
                      }
                    />
                  </Field>
                  <Field label="End">
                    <DateInput
                      value={item.endDate}
                      placeholder="2023-06"
                      disabled={item.current}
                      onChange={(endDate) =>
                        updateItem(id, item.id, { endDate })
                      }
                    />
                  </Field>
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={item.current}
                  onCheckedChange={(v) =>
                    updateItem(id, item.id, { current: v === true })
                  }
                />
                I currently work here
              </label>
              <div className="mt-3">
                <Field label="Summary" hint="Optional one-line role summary.">
                  <Textarea
                    value={item.summary}
                    onChange={(e) =>
                      updateItem(id, item.id, { summary: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="mt-3">
                <StringListEditor
                  label="Highlights"
                  values={item.highlights}
                  placeholder="Achievement or responsibility…"
                  addLabel="Add highlight"
                  onChange={(highlights) =>
                    updateItem(id, item.id, { highlights })
                  }
                />
              </div>
              <div className="mt-3">
                <Field
                  label="Tags legend"
                  hint="Chips render under the item header; the legend is optional."
                >
                  <Input
                    value={item.tagsLabel}
                    placeholder="TechStack"
                    onChange={(e) =>
                      updateItem(id, item.id, { tagsLabel: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="mt-3">
                <StringListEditor
                  label="Tags"
                  values={item.tags}
                  placeholder="TypeScript"
                  addLabel="Add tag"
                  suggestionKind="skill"
                  onChange={(tags) => updateItem(id, item.id, { tags })}
                />
              </div>
            </ItemFrame>
          </SortableItem>
        ))}
      </SortableList>
    </>
  )
}
