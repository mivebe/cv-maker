import { Plus, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useAvatarHistory } from '../../store/useAvatarHistory'
import { Field, ItemControls, SectionCard } from '@/components/app-ui'
import { IconPicker } from '@/components/IconPicker'
import { SortableItem, SortableList } from '@/components/reorder/SortableList'
import { SuggestInput } from '@/components/SuggestInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { fileToAvatarDataUrl } from '../../lib/image'
import { DIAL_CODES } from '../../lib/phone'

/** Radix rejects an empty option value; this stands in for "no dialing code". */
const NO_CODE = '__none__'

export function BasicsEditor() {
  const basics = useStore((s) => s.profile.basics)
  const updateBasics = useStore((s) => s.updateBasics)
  const addLink = useStore((s) => s.addLink)
  const updateLink = useStore((s) => s.updateLink)
  const removeLink = useStore((s) => s.removeLink)
  const moveLink = useStore((s) => s.moveLink)
  const setLinkOrder = useStore((s) => s.setLinkOrder)
  const recentAvatars = useAvatarHistory((s) => s.recent)
  const rememberAvatar = useAvatarHistory((s) => s.rememberAvatar)
  const forgetAvatar = useAvatarHistory((s) => s.forgetAvatar)
  const fileInput = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')

  const applyPhoto = (photo: string) => {
    updateBasics({ photo })
    rememberAvatar(photo)
  }

  // Store the upload as a downscaled data URL, not an object URL: only a data
  // URL survives a JSON export / reload, and only a downscaled one fits in
  // localStorage alongside the rest of the profile.
  const readFile = async (file: File) => {
    try {
      applyPhoto(await fileToAvatarDataUrl(file))
      setPhotoError('')
    } catch {
      setPhotoError(`Could not read ${file.name}.`)
    }
  }

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
          <SuggestInput
            kind="role"
            value={basics.headline}
            onChange={(headline) => updateBasics({ headline })}
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
          <div className="flex gap-2">
            <Select
              value={basics.phoneCode || NO_CODE}
              onValueChange={(v) =>
                updateBasics({ phoneCode: v === NO_CODE ? '' : v })
              }
            >
              <SelectTrigger className="w-20 shrink-0 px-2">
                {/* The trigger is narrow: show the code, not the country. */}
                <SelectValue>{basics.phoneCode || 'Code'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CODE}>No code</SelectItem>
                {DIAL_CODES.map((c) => (
                  <SelectItem key={c.iso} value={c.code}>
                    {c.code} · {c.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="min-w-0 flex-1"
              value={basics.phone}
              onChange={(e) => updateBasics({ phone: e.target.value })}
              placeholder="88 123 4567"
            />
          </div>
        </Field>
        <Field label="Location">
          <SuggestInput
            kind="location"
            value={basics.location}
            onChange={(location) => updateBasics({ location })}
            placeholder="City, Country"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field
          label="Summary"
          hint="A short professional summary (2–4 sentences)."
        >
          <Textarea
            value={basics.summary}
            onChange={(e) => updateBasics({ summary: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-5">
        <span className="mb-2 block text-xs font-medium text-muted-foreground">
          Photo
        </span>
        <div className="flex flex-wrap items-start gap-3">
          {basics.photo && (
            <img
              src={basics.photo}
              alt={basics.photoAlt || 'Avatar preview'}
              className="size-16 shrink-0 rounded-full border object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void readFile(file)
                  // Allow re-picking the same file.
                  e.target.value = ''
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                <Upload />
                Upload
              </Button>
              {basics.photo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    // Park it in the history on the way out, so removing a
                    // photo is undoable even if it was never re-uploaded here.
                    rememberAvatar(basics.photo)
                    updateBasics({ photo: '' })
                  }}
                >
                  <X />
                  Remove photo
                </Button>
              )}
            </div>
            {basics.photo.startsWith('data:') ? (
              // A base64 blob in a text box is unreadable and un-editable; the
              // preview + Remove are the only controls that make sense for it.
              <p className="text-xs text-muted-foreground">
                Uploaded image embedded in the profile.
              </p>
            ) : (
              <Input
                value={basics.photo}
                placeholder="…or paste an image URL"
                onChange={(e) => updateBasics({ photo: e.target.value })}
                // A URL is remembered once it's settled, not per keystroke.
                onBlur={(e) => rememberAvatar(e.target.value)}
              />
            )}
            {photoError && (
              <p className="text-xs text-destructive">{photoError}</p>
            )}
            <Input
              value={basics.photoAlt}
              placeholder="Alt text (Portrait of Alex Rivera)"
              onChange={(e) => updateBasics({ photoAlt: e.target.value })}
            />
          </div>
        </div>

        {recentAvatars.length > 0 && (
          <div className="mt-3">
            <span className="mb-1.5 block text-xs text-muted-foreground">
              Recent photos
            </span>
            <div className="flex flex-wrap gap-2">
              {recentAvatars.map((src) => (
                <div key={src} className="group relative">
                  <button
                    type="button"
                    aria-label="Use this photo"
                    aria-pressed={basics.photo === src}
                    onClick={() => applyPhoto(src)}
                    className="size-12 cursor-pointer overflow-hidden rounded-md border transition-transform hover:scale-105 aria-pressed:ring-2 aria-pressed:ring-ring"
                  >
                    <img src={src} alt="" className="size-full object-cover" />
                  </button>
                  <button
                    type="button"
                    aria-label="Forget this photo"
                    onClick={() => forgetAvatar(src)}
                    className="absolute -right-1.5 -top-1.5 hidden size-4 cursor-pointer place-items-center rounded-full border bg-background text-muted-foreground hover:text-destructive group-hover:grid focus-visible:grid"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Links
          </span>
          <Button variant="ghost" onClick={addLink}>
            <Plus />
            Add link
          </Button>
        </div>
        <SortableList
          ids={basics.links.map((l) => l.id)}
          onReorder={setLinkOrder}
          className="space-y-2"
        >
          {basics.links.map((link, i) => (
            // Narrow: label takes its own row, URL + controls share the next.
            <SortableItem
              key={link.id}
              id={link.id}
              className="flex flex-wrap items-center gap-2"
            >
              <IconPicker
                className="w-32 shrink-0"
                value={link.icon}
                onChange={(icon) => updateLink(link.id, { icon })}
              />
              <SuggestInput
                kind="linkLabel"
                className="w-full sm:w-40"
                value={link.label}
                placeholder="Label (GitHub)"
                onChange={(label) => updateLink(link.id, { label })}
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
            </SortableItem>
          ))}
        </SortableList>
      </div>
    </SectionCard>
  )
}
