import { useStore } from '../../store/useStore'
import { EmptyHint, Field } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function ProjectsEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'projects') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No projects yet.</EmptyHint>}
      <SortableList
        ids={items.map((it) => it.id)}
        onReorder={(ids) => setItemOrder(id, ids)}
        className="space-y-4"
      >
        {items.map((item, i) => (
          <SortableItem key={item.id} id={item.id}>
            <ItemFrame
              title={item.name}
              onUp={() => moveItem(id, item.id, 'up')}
              onDown={() => moveItem(id, item.id, 'down')}
              onRemove={() => removeItem(id, item.id)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(id, item.id, { name: e.target.value })
                    }
                  />
                </Field>
                <Field label="URL">
                  <Input
                    value={item.url}
                    placeholder="https://…"
                    onChange={(e) =>
                      updateItem(id, item.id, { url: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Icon">
                  <IconPicker
                    className="w-full"
                    value={item.icon}
                    onChange={(icon) => updateItem(id, item.id, { icon })}
                  />
                </Field>
                <Field label="Badge" hint="Short pill, e.g. “live”.">
                  <Input
                    value={item.badge}
                    placeholder="live"
                    onChange={(e) =>
                      updateItem(id, item.id, { badge: e.target.value })
                    }
                  />
                </Field>
                <Field label="Meta" hint="Right-aligned note.">
                  <Input
                    value={item.meta}
                    placeholder="iOS AppStore"
                    onChange={(e) =>
                      updateItem(id, item.id, { meta: e.target.value })
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
                  placeholder="Notable detail…"
                  addLabel="Add highlight"
                  onChange={(highlights) =>
                    updateItem(id, item.id, { highlights })
                  }
                />
              </div>
            </ItemFrame>
          </SortableItem>
        ))}
      </SortableList>
    </>
  )
}
