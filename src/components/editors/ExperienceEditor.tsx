import { useStore } from '../../store/useStore'
import { Button, Field, SectionCard, TextArea, TextInput, EmptyHint } from '../ui'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function ExperienceEditor() {
  const items = useStore((s) => s.profile.experience)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)

  return (
    <SectionCard
      title="Experience"
      description="Roles, most recent first."
      action={
        <Button variant="primary" onClick={() => addItem('experience')}>
          + Add role
        </Button>
      }
    >
      {items.length === 0 && <EmptyHint>No experience yet.</EmptyHint>}
      <div className="space-y-4">
        {items.map((item, i) => (
          <ItemFrame
            key={item.id}
            title={
              [item.role, item.organization].filter(Boolean).join(' · ') || ''
            }
            onUp={() => moveItem('experience', item.id, 'up')}
            onDown={() => moveItem('experience', item.id, 'down')}
            onRemove={() => removeItem('experience', item.id)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role / title">
                <TextInput
                  value={item.role}
                  onChange={(e) =>
                    updateItem('experience', item.id, { role: e.target.value })
                  }
                />
              </Field>
              <Field label="Organization">
                <TextInput
                  value={item.organization}
                  onChange={(e) =>
                    updateItem('experience', item.id, {
                      organization: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Location">
                <TextInput
                  value={item.location}
                  onChange={(e) =>
                    updateItem('experience', item.id, {
                      location: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <TextInput
                    value={item.startDate}
                    placeholder="2021"
                    onChange={(e) =>
                      updateItem('experience', item.id, {
                        startDate: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="End">
                  <TextInput
                    value={item.endDate}
                    placeholder="2023"
                    disabled={item.current}
                    onChange={(e) =>
                      updateItem('experience', item.id, {
                        endDate: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={item.current}
                onChange={(e) =>
                  updateItem('experience', item.id, {
                    current: e.target.checked,
                  })
                }
              />
              I currently work here
            </label>
            <div className="mt-3">
              <Field label="Summary" hint="Optional one-line role summary.">
                <TextArea
                  value={item.summary}
                  onChange={(e) =>
                    updateItem('experience', item.id, {
                      summary: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
            <div className="mt-3">
              <StringListEditor
                label="Highlights"
                values={item.highlights}
                placeholder="Achievement or responsibility…"
                addLabel="Add highlight"
                onChange={(highlights) =>
                  updateItem('experience', item.id, { highlights })
                }
              />
            </div>
          </ItemFrame>
        ))}
      </div>
    </SectionCard>
  )
}
