import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls, SliderField } from '@/components/app-ui'
import { effectiveOptions } from '../../lib/sections'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { SuggestInput } from '@/components/SuggestInput'
import { Input } from '@/components/ui/input'

export function SliderListEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  const setItemOrder = useStore((s) => s.setItemOrder)
  if (!section || section.kind !== 'sliders') return null
  const items = section.items
  const steps = effectiveOptions(section).sliderSteps

  return (
    <>
      {items.length === 0 && <EmptyHint>No sliders yet.</EmptyHint>}
      <SortableList
        ids={items.map((it) => it.id)}
        onReorder={(ids) => setItemOrder(id, ids)}
        className="space-y-3"
      >
        {items.map((item, i) => (
          <SortableItem
            key={item.id}
            id={item.id}
            className="rounded-lg border bg-muted/30 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SuggestInput
                kind="skill"
                className="min-w-0 flex-1"
                value={item.title}
                placeholder="React"
                onChange={(title) => updateItem(id, item.id, { title })}
              />
              <Input
                className="min-w-0 flex-1"
                value={item.subtitle}
                placeholder="Subtitle (optional)"
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
            </div>
            <div className="mt-2">
              <SliderField
                label="Level"
                value={Math.min(Math.max(1, item.value), steps)}
                min={1}
                max={steps}
                step={1}
                suffix={` / ${steps}`}
                onChange={(value) => updateItem(id, item.id, { value })}
              />
            </div>
          </SortableItem>
        ))}
      </SortableList>
    </>
  )
}
