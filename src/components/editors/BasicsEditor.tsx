import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Field, ItemControls, SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function BasicsEditor() {
  const basics = useStore((s) => s.profile.basics)
  const updateBasics = useStore((s) => s.updateBasics)
  const addLink = useStore((s) => s.addLink)
  const updateLink = useStore((s) => s.updateLink)
  const removeLink = useStore((s) => s.removeLink)
  const moveLink = useStore((s) => s.moveLink)

  return (
    <SectionCard
      title="Basics"
      description="Name, contact details, headline, and summary."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={basics.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="Alex Rivera"
          />
        </Field>
        <Field label="Headline">
          <Input
            value={basics.headline}
            onChange={(e) => updateBasics({ headline: e.target.value })}
            placeholder="Senior Software Engineer"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={basics.email}
            onChange={(e) => updateBasics({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={basics.phone}
            onChange={(e) => updateBasics({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </Field>
        <Field label="Location">
          <Input
            value={basics.location}
            onChange={(e) => updateBasics({ location: e.target.value })}
            placeholder="City, Country"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Summary" hint="A short professional summary (2–4 sentences).">
          <Textarea
            value={basics.summary}
            onChange={(e) => updateBasics({ summary: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Links</span>
          <Button variant="ghost" onClick={addLink}>
            <Plus />
            Add link
          </Button>
        </div>
        <div className="space-y-2">
          {basics.links.map((link, i) => (
            // Narrow: label takes its own row, URL + controls share the next.
            <div key={link.id} className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-40"
                value={link.label}
                placeholder="Label (GitHub)"
                onChange={(e) => updateLink(link.id, { label: e.target.value })}
              />
              <Input
                className="min-w-0 flex-1"
                value={link.url}
                placeholder="https://…"
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
              />
              <ItemControls
                onUp={() => moveLink(link.id, 'up')}
                onDown={() => moveLink(link.id, 'down')}
                onRemove={() => removeLink(link.id)}
                disableUp={i === 0}
                disableDown={i === basics.links.length - 1}
              />
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
