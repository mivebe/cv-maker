import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import {
  EmptyHint,
  Field,
  ItemControls,
  SectionCard,
} from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

export function CustomSectionsEditor() {
  const sections = useStore((s) => s.profile.custom)
  const addCustomSection = useStore((s) => s.addCustomSection)
  const updateCustomSection = useStore((s) => s.updateCustomSection)
  const removeCustomSection = useStore((s) => s.removeCustomSection)
  const moveCustomSection = useStore((s) => s.moveCustomSection)
  const addCustomItem = useStore((s) => s.addCustomItem)
  const updateCustomItem = useStore((s) => s.updateCustomItem)
  const removeCustomItem = useStore((s) => s.removeCustomItem)
  const moveCustomItem = useStore((s) => s.moveCustomItem)

  return (
    <SectionCard
      title="Custom sections"
      description="Anything the standard sections don't cover - awards, talks, certifications."
      action={
        <Button variant="default" onClick={addCustomSection}>
          <Plus />
          Add section
        </Button>
      }
    >
      {sections.length === 0 && <EmptyHint>No custom sections yet.</EmptyHint>}
      <div className="space-y-5">
        {sections.map((section, si) => (
          <div key={section.id} className="rounded-md border p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-2">
              <Input
                className="min-w-0 flex-1"
                value={section.title}
                placeholder="Section title"
                onChange={(e) =>
                  updateCustomSection(section.id, { title: e.target.value })
                }
              />
              <ItemControls
                onUp={() => moveCustomSection(section.id, 'up')}
                onDown={() => moveCustomSection(section.id, 'down')}
                onRemove={() => removeCustomSection(section.id)}
                disableUp={si === 0}
                disableDown={si === sections.length - 1}
              />
            </div>

            <div className="space-y-3 pl-1">
              {section.items.map((item, i) => (
                <ItemFrame
                  key={item.id}
                  title={item.title}
                  onUp={() => moveCustomItem(section.id, item.id, 'up')}
                  onDown={() => moveCustomItem(section.id, item.id, 'down')}
                  onRemove={() => removeCustomItem(section.id, item.id)}
                  disableUp={i === 0}
                  disableDown={i === section.items.length - 1}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title">
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          updateCustomItem(section.id, item.id, {
                            title: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Subtitle">
                      <Input
                        value={item.subtitle}
                        onChange={(e) =>
                          updateCustomItem(section.id, item.id, {
                            subtitle: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Date">
                      <Input
                        value={item.date}
                        onChange={(e) =>
                          updateCustomItem(section.id, item.id, {
                            date: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Description">
                      <Textarea
                        value={item.description}
                        onChange={(e) =>
                          updateCustomItem(section.id, item.id, {
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
                      addLabel="Add highlight"
                      onChange={(highlights) =>
                        updateCustomItem(section.id, item.id, { highlights })
                      }
                    />
                  </div>
                </ItemFrame>
              ))}
            </div>

            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => addCustomItem(section.id)}
            >
              <Plus />
              Add item
            </Button>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
