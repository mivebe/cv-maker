import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { EmptyHint, Field, SectionCard } from '@/components/app-ui'
import { SuggestInput } from '@/components/SuggestInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
        <Button variant="default" onClick={() => addItem('experience')}>
          <Plus />
          Add role
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
                <SuggestInput
                  kind="role"
                  value={item.role}
                  onChange={(role) =>
                    updateItem('experience', item.id, { role })
                  }
                />
              </Field>
              <Field label="Organization">
                <SuggestInput
                  kind="organization"
                  value={item.organization}
                  onChange={(organization) =>
                    updateItem('experience', item.id, { organization })
                  }
                />
              </Field>
              <Field label="Location">
                <SuggestInput
                  kind="location"
                  value={item.location}
                  onChange={(location) =>
                    updateItem('experience', item.id, { location })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <Input
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
                  <Input
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
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={item.current}
                onCheckedChange={(v) =>
                  updateItem('experience', item.id, {
                    current: v === true,
                  })
                }
              />
              I currently work here
            </label>
            <div className="mt-3">
              <Field label="Summary" hint="Optional one-line role summary.">
                <Textarea
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
