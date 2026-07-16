import { useStore } from '../../store/useStore'
import { EmptyHint, Field } from '@/components/app-ui'
import { SuggestInput } from '@/components/SuggestInput'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function SkillsEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  if (!section || section.kind !== 'skills') return null
  const groups = section.items

  return (
    <>
      {groups.length === 0 && <EmptyHint>No skill groups yet.</EmptyHint>}
      <div className="space-y-4">
        {groups.map((group, i) => (
          <ItemFrame
            key={group.id}
            title={group.name}
            onUp={() => moveItem(id, group.id, 'up')}
            onDown={() => moveItem(id, group.id, 'down')}
            onRemove={() => removeItem(id, group.id)}
            disableUp={i === 0}
            disableDown={i === groups.length - 1}
          >
            <div className="grid gap-3">
              <Field label="Group name">
                <SuggestInput
                  kind="skillGroup"
                  value={group.name}
                  placeholder="Languages"
                  onChange={(name) => updateItem(id, group.id, { name })}
                />
              </Field>
              <StringListEditor
                label="Skills"
                values={group.skills}
                placeholder="TypeScript"
                addLabel="Add skill"
                suggestionKind="skill"
                onChange={(skills) => updateItem(id, group.id, { skills })}
              />
            </div>
          </ItemFrame>
        ))}
      </div>
    </>
  )
}
