import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { EmptyHint, ItemControls, SectionCard } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { SuggestInput } from '@/components/SuggestInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TotalsEditor() {
  const items = useStore((s) => s.profile.totals)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)

  return (
    <SectionCard
      title="Totals"
      description="Years-of-experience grid printed at the end of the CV."
      action={
        <Button variant="default" onClick={() => addItem('totals')}>
          <Plus />
          Add total
        </Button>
      }
    >
      {items.length === 0 && <EmptyHint>No totals yet.</EmptyHint>}
      <div className="space-y-2">
        {items.map((item, i) => (
          // A single row per cell: three short values do not earn an ItemFrame.
          <div key={item.id} className="flex flex-wrap items-center gap-2">
            <IconPicker
              className="w-32 shrink-0"
              value={item.icon}
              onChange={(icon) => updateItem('totals', item.id, { icon })}
            />
            <SuggestInput
              kind="skill"
              className="min-w-0 flex-1"
              value={item.label}
              placeholder="TypeScript"
              onChange={(label) => updateItem('totals', item.id, { label })}
            />
            <Input
              className="w-20 shrink-0"
              value={item.value}
              placeholder="6y"
              onChange={(e) =>
                updateItem('totals', item.id, { value: e.target.value })
              }
            />
            <ItemControls
              onUp={() => moveItem('totals', item.id, 'up')}
              onDown={() => moveItem('totals', item.id, 'down')}
              onRemove={() => removeItem('totals', item.id)}
              disableUp={i === 0}
              disableDown={i === items.length - 1}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
