import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { SuggestInput } from '@/components/SuggestInput'
import { Input } from '@/components/ui/input'

export function TotalsEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'totals') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No totals yet.</EmptyHint>}
      <SortableList
        ids={items.map((it) => it.id)}
        onReorder={(ids) => setItemOrder(id, ids)}
        className="space-y-2"
      >
        {items.map((item, i) => (
          // A single row per cell: three short values do not earn an ItemFrame.
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
            <SuggestInput
              kind="skill"
              className="min-w-0 flex-1"
              value={item.label}
              placeholder="TypeScript"
              onChange={(label) => updateItem(id, item.id, { label })}
            />
            <Input
              className="w-20 shrink-0"
              value={item.value}
              placeholder="6y"
              onChange={(e) =>
                updateItem(id, item.id, { value: e.target.value })
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
