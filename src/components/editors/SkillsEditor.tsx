import { useStore } from '../../store/useStore'
import { Button, Field, SectionCard, TextInput, EmptyHint } from '../ui'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function SkillsEditor() {
  const groups = useStore((s) => s.profile.skills)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)

  return (
    <SectionCard
      title="Skills"
      description="Grouped by category (e.g. Languages, Frontend)."
      action={
        <Button variant="primary" onClick={() => addItem('skills')}>
          + Add group
        </Button>
      }
    >
      {groups.length === 0 && <EmptyHint>No skill groups yet.</EmptyHint>}
      <div className="space-y-4">
        {groups.map((group, i) => (
          <ItemFrame
            key={group.id}
            title={group.name}
            onUp={() => moveItem('skills', group.id, 'up')}
            onDown={() => moveItem('skills', group.id, 'down')}
            onRemove={() => removeItem('skills', group.id)}
            disableUp={i === 0}
            disableDown={i === groups.length - 1}
          >
            <div className="grid gap-3">
              <Field label="Group name">
                <TextInput
                  value={group.name}
                  placeholder="Languages"
                  onChange={(e) =>
                    updateItem('skills', group.id, { name: e.target.value })
                  }
                />
              </Field>
              <StringListEditor
                label="Skills"
                values={group.skills}
                placeholder="TypeScript"
                addLabel="Add skill"
                onChange={(skills) =>
                  updateItem('skills', group.id, { skills })
                }
              />
            </div>
          </ItemFrame>
        ))}
      </div>
    </SectionCard>
  )
}
