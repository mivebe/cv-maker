import { useStore } from '../../store/useStore'
import { Button, Field, SectionCard, TextArea, TextInput, EmptyHint } from '../ui'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function ProjectsEditor() {
  const items = useStore((s) => s.profile.projects)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)

  return (
    <SectionCard
      title="Projects"
      action={
        <Button variant="primary" onClick={() => addItem('projects')}>
          + Add project
        </Button>
      }
    >
      {items.length === 0 && <EmptyHint>No projects yet.</EmptyHint>}
      <div className="space-y-4">
        {items.map((item, i) => (
          <ItemFrame
            key={item.id}
            title={item.name}
            onUp={() => moveItem('projects', item.id, 'up')}
            onDown={() => moveItem('projects', item.id, 'down')}
            onRemove={() => removeItem('projects', item.id)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <TextInput
                  value={item.name}
                  onChange={(e) =>
                    updateItem('projects', item.id, { name: e.target.value })
                  }
                />
              </Field>
              <Field label="URL">
                <TextInput
                  value={item.url}
                  placeholder="https://…"
                  onChange={(e) =>
                    updateItem('projects', item.id, { url: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Description">
                <TextArea
                  value={item.description}
                  onChange={(e) =>
                    updateItem('projects', item.id, {
                      description: e.target.value,
                    })
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
                  updateItem('projects', item.id, { highlights })
                }
              />
            </div>
          </ItemFrame>
        ))}
      </div>
    </SectionCard>
  )
}
