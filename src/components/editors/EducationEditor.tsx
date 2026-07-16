import { useStore } from '../../store/useStore'
import { EmptyHint, Field } from '@/components/app-ui'
import { DateInput } from '@/components/DateInput'
import { SuggestInput } from '@/components/SuggestInput'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'

export function EducationEditor({ id }: { id: string }) {
  const section = useStore((s) => s.profile.sections.find((x) => x.id === id))
  const updateItem = useStore((s) => s.updateItem)
  const removeItem = useStore((s) => s.removeItem)
  const moveItem = useStore((s) => s.moveItem)
  if (!section || section.kind !== 'education') return null
  const items = section.items

  return (
    <>
      {items.length === 0 && <EmptyHint>No education yet.</EmptyHint>}
      <div className="space-y-4">
        {items.map((item, i) => (
          <ItemFrame
            key={item.id}
            title={
              [item.degree, item.institution].filter(Boolean).join(' · ') || ''
            }
            onUp={() => moveItem(id, item.id, 'up')}
            onDown={() => moveItem(id, item.id, 'down')}
            onRemove={() => removeItem(id, item.id)}
            disableUp={i === 0}
            disableDown={i === items.length - 1}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Degree / qualification">
                <SuggestInput
                  kind="degree"
                  value={item.degree}
                  onChange={(degree) => updateItem(id, item.id, { degree })}
                />
              </Field>
              <Field label="Institution">
                <SuggestInput
                  kind="institution"
                  value={item.institution}
                  onChange={(institution) =>
                    updateItem(id, item.id, { institution })
                  }
                />
              </Field>
              <Field label="Location">
                <SuggestInput
                  kind="location"
                  value={item.location}
                  onChange={(location) => updateItem(id, item.id, { location })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start">
                  <DateInput
                    value={item.startDate}
                    placeholder="2011"
                    onChange={(startDate) =>
                      updateItem(id, item.id, { startDate })
                    }
                  />
                </Field>
                <Field label="End">
                  <DateInput
                    value={item.endDate}
                    placeholder="2015"
                    onChange={(endDate) => updateItem(id, item.id, { endDate })}
                  />
                </Field>
              </div>
            </div>
            <div className="mt-3">
              <Field label="Details" hint="Honors, focus, GPA, etc.">
                <Textarea
                  value={item.details}
                  onChange={(e) =>
                    updateItem(id, item.id, { details: e.target.value })
                  }
                />
              </Field>
            </div>
          </ItemFrame>
        ))}
      </div>
    </>
  )
}
