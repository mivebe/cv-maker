import { useStore } from '../../store/useStore'
import { Button, Field, ItemControls, SectionCard, TextArea, TextInput } from '../ui'

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
          <TextInput
            value={basics.name}
            onChange={(e) => updateBasics({ name: e.target.value })}
            placeholder="Alex Rivera"
          />
        </Field>
        <Field label="Headline">
          <TextInput
            value={basics.headline}
            onChange={(e) => updateBasics({ headline: e.target.value })}
            placeholder="Senior Software Engineer"
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={basics.email}
            onChange={(e) => updateBasics({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone">
          <TextInput
            value={basics.phone}
            onChange={(e) => updateBasics({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </Field>
        <Field label="Location">
          <TextInput
            value={basics.location}
            onChange={(e) => updateBasics({ location: e.target.value })}
            placeholder="City, Country"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Summary" hint="A short professional summary (2–4 sentences).">
          <TextArea
            value={basics.summary}
            onChange={(e) => updateBasics({ summary: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Links</span>
          <Button variant="ghost" onClick={addLink}>
            + Add link
          </Button>
        </div>
        <div className="space-y-2">
          {basics.links.map((link, i) => (
            <div key={link.id} className="flex items-center gap-2">
              <TextInput
                className="max-w-[160px]"
                value={link.label}
                placeholder="Label (GitHub)"
                onChange={(e) => updateLink(link.id, { label: e.target.value })}
              />
              <TextInput
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
