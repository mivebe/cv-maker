import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { Input } from '@/components/ui/input'

export function ChartEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  if (!section || section.kind !== 'chart') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No slices yet.</EmptyHint>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <IconPicker
              className="w-32 shrink-0"
              value={item.icon}
              onChange={(icon) => updateItem(id, item.id, { icon })}
            />
            <Input
              className="min-w-0 flex-1"
              value={item.title}
              placeholder="Frontend"
              onChange={(e) =>
                updateItem(id, item.id, { title: e.target.value })
              }
            />
            <Input
              className="w-20 shrink-0"
              type="number"
              min={0}
              value={item.value}
              onChange={(e) =>
                updateItem(id, item.id, { value: Number(e.target.value) || 0 })
              }
            />
            <ItemControls
              onUp={() => moveItem(id, item.id, 'up')}
              onDown={() => moveItem(id, item.id, 'down')}
              onRemove={() => removeItem(id, item.id)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            />
          </div>
        ))}
      </div>
    </>
  )
}
