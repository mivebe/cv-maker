import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls } from '@/components/app-ui'
import { LANGUAGE_STAGES } from '../../lib/sections'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguagesEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'languages') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No languages yet.</EmptyHint>}
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
            <Input
              className="min-w-0 flex-1"
              value={item.name}
              placeholder="German"
              onChange={(e) =>
                updateItem(id, item.id, { name: e.target.value })
              }
            />
            {/* The stage labels are fixed (LANGUAGE_STAGES): nothing to type,
                and no way for the words and the notch count to disagree. */}
            <Select
              value={String(item.level)}
              onValueChange={(v) =>
                updateItem(id, item.id, { level: Number(v) })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_STAGES.map((stage, level) => (
                  <SelectItem key={stage} value={String(level + 1)}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
