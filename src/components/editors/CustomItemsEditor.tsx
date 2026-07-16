import { useStore } from '../../store/useStore'
import { DateInput } from '@/components/DateInput'
import { EmptyHint, Field } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

/** The free-form section: title/subtitle/date/description/highlights/tags. */
export function CustomItemsEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  if (!section || section.kind !== 'items') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No items yet.</EmptyHint>}
      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemFrame
            key={item.id}
            title={item.title}
            onUp={() => moveItem(id, item.id, 'up')}
            onDown={() => moveItem(id, item.id, 'down')}
            onRemove={() => removeItem(id, item.id)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    updateItem(id, item.id, { title: e.target.value })
                  }
                />
              </Field>
              <Field label="Subtitle">
                <Input
                  value={item.subtitle}
                  onChange={(e) =>
                    updateItem(id, item.id, { subtitle: e.target.value })
                  }
                />
              </Field>
              <Field label="Date">
                <DateInput
                  value={item.date}
                  onChange={(date) => updateItem(id, item.id, { date })}
                />
              </Field>
              <Field label="Icon">
                <IconPicker
                  className="w-full"
                  value={item.icon}
                  onChange={(icon) => updateItem(id, item.id, { icon })}
                />
              </Field>
              <Field label="Meta" hint="Right-aligned note.">
                <Input
                  value={item.meta}
                  placeholder="AltStore & SideStore"
                  onChange={(e) =>
                    updateItem(id, item.id, { meta: e.target.value })
                  }
                />
              </Field>
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
              <Field label="Description">
                <Textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(id, item.id, { description: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-3">
              <StringListEditor
                label="Highlights"
                values={item.highlights}
                addLabel="Add highlight"
                onChange={(highlights) =>
                  updateItem(id, item.id, { highlights })
                }
              />
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
        ))}
      </div>
    </>
  )
}
