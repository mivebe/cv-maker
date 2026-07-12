import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { CustomSection } from '../../schema/profile'
import { Field, ItemControls } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ItemFrame } from './ItemFrame'
import { StringListEditor } from './StringListEditor'

/** Adds a custom section. Lives in the page header, not in a card. */
export function AddCustomSectionButton() {
  const addCustomSection = useStore((s) => s.addCustomSection)
  return (
    <Button variant="default" onClick={addCustomSection}>
      <Plus />
      Add custom section
    </Button>
  )
}

/**
 * One custom section as a standalone card, so the page can spread the sections
 * across its columns instead of stacking them all in one.
 */
export function CustomSectionCard({
  section,
  index,
  total,
}: {
  section: CustomSection
  index: number
  total: number
}) {
  const updateCustomSection = useStore((s) => s.updateCustomSection)
  const removeCustomSection = useStore((s) => s.removeCustomSection)
  const moveCustomSection = useStore((s) => s.moveCustomSection)
  const addCustomItem = useStore((s) => s.addCustomItem)
  const updateCustomItem = useStore((s) => s.updateCustomItem)
  const removeCustomItem = useStore((s) => s.removeCustomItem)
  const moveCustomItem = useStore((s) => s.moveCustomItem)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
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
            disableUp={index === 0}
            disableDown={index === total - 1}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <Field label="Subtitle">
            <Input
              value={section.subtitle}
              placeholder="Small line under the title"
              onChange={(e) =>
                updateCustomSection(section.id, {
                  subtitle: e.target.value,
                })
              }
            />
          </Field>
          <Field
            label="Display"
            hint={
              section.display === 'banner'
                ? 'Banner: a centered title-only heading block (a page divider). Items are not rendered.'
                : 'Items: a normal section with a list of entries.'
            }
          >
            <Select
              value={section.display}
              onValueChange={(v) =>
                updateCustomSection(section.id, {
                  display: v === 'banner' ? 'banner' : 'items',
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {section.display === 'banner' && section.items.length > 0 && (
          <p className="mb-3 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            This section is a banner, so its {section.items.length} item(s) are
            kept but not rendered in the CV.
          </p>
        )}

        <div
          className={section.display === 'banner' ? 'hidden' : 'space-y-3 pl-1'}
        >
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
                <Field label="Icon">
                  <IconPicker
                    className="w-full"
                    value={item.icon}
                    onChange={(icon) =>
                      updateCustomItem(section.id, item.id, { icon })
                    }
                  />
                </Field>
                <Field label="Meta" hint="Right-aligned note.">
                  <Input
                    value={item.meta}
                    placeholder="AltStore & SideStore"
                    onChange={(e) =>
                      updateCustomItem(section.id, item.id, {
                        meta: e.target.value,
                      })
                    }
                  />
                </Field>
                <Field
                  label="Tags legend"
                  hint="Chips render under the item header; the legend is optional."
                >
                  <Input
                    value={item.tagsLabel}
                    placeholder="TechStack"
                    onChange={(e) =>
                      updateCustomItem(section.id, item.id, {
                        tagsLabel: e.target.value,
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
              <div className="mt-3">
                <StringListEditor
                  label="Tags"
                  values={item.tags}
                  placeholder="TypeScript"
                  addLabel="Add tag"
                  suggestionKind="skill"
                  onChange={(tags) =>
                    updateCustomItem(section.id, item.id, { tags })
                  }
                />
              </div>
            </ItemFrame>
          ))}
        </div>

        {section.display !== 'banner' && (
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => addCustomItem(section.id)}
          >
            <Plus />
            Add item
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
