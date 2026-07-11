import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { EmptyHint, Field, SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'

export function EducationEditor() {
  const items = useStore((s) => s.profile.education)
  const addItem = useStore((s) => s.addItem)
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)

  return (
    <SectionCard
      title="Education"
      action={
        <Button variant="default" onClick={() => addItem('education')}>
          <Plus />
          Add education
        </Button>
      }
    >
      {items.length === 0 && <EmptyHint>No education yet.</EmptyHint>}
      <div className="space-y-4">
        {items.map((item, i) => (
          <ItemFrame
            key={item.id}
            title={
              [item.degree, item.institution].filter(Boolean).join(' · ') || ''
            }
            onUp={() => moveItem('education', item.id, 'up')}
            onDown={() => moveItem('education', item.id, 'down')}
            onRemove={() => removeItem('education', item.id)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Degree / qualification">
                <Input
                  value={item.degree}
                  onChange={(e) =>
                    updateItem('education', item.id, { degree: e.target.value })
                  }
                />
              </Field>
              <Field label="Institution">
                <Input
                  value={item.institution}
                  onChange={(e) =>
                    updateItem('education', item.id, {
                      institution: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Location">
                <Input
                  value={item.location}
                  onChange={(e) =>
                    updateItem('education', item.id, {
                      location: e.target.value,
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <Input
                    value={item.startDate}
                    placeholder="2011"
                    onChange={(e) =>
                      updateItem('education', item.id, {
                        startDate: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="End">
                  <Input
                    value={item.endDate}
                    placeholder="2015"
                    onChange={(e) =>
                      updateItem('education', item.id, {
                        endDate: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>
            <div className="mt-3">
              <Field label="Details" hint="Honors, focus, GPA, etc.">
                <Textarea
                  value={item.details}
                  onChange={(e) =>
                    updateItem('education', item.id, {
                      details: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </ItemFrame>
        ))}
      </div>
    </SectionCard>
  )
}
