import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { Input } from '@/components/ui/input'

export function TitleListEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'titleList') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No entries yet.</EmptyHint>}
      <SortableList
        ids={items.map((it) => it.id)}
        onReorder={(ids) => setItemOrder(id, ids)}
        className="space-y-2"
      >
        {items.map((item, i) => (
          <SortableItem
            key={item.id}
            id={item.id}
            className="flex flex-wrap items-center gap-2"
          >
            <IconPicker
              className="w-32 shrink-0"
              value={item.icon}
              onChange={(icon) => updateItem(id, item.id, { icon })}
            />
            <Input
              className="min-w-0 flex-1"
              value={item.title}
              placeholder="AWS Certified"
              onChange={(e) =>
                updateItem(id, item.id, { title: e.target.value })
              }
            />
            <Input
              className="w-28 shrink-0"
              value={item.subtitle}
              placeholder="2024"
              onChange={(e) =>
                updateItem(id, item.id, { subtitle: e.target.value })
              }
            />
            <ItemControls
              onUp={() => moveItem(id, item.id, 'up')}
              onDown={() => moveItem(id, item.id, 'down')}
              onRemove={() => removeItem(id, item.id)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            />
          </SortableItem>
        ))}
      </SortableList>
    </>
  )
}
