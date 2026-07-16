import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Field, SectionCard } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fileToAvatarDataUrl } from '../../lib/image'

/**
 * The organisation issuing the CV - an agency, a studio, a recruiter - as
 * opposed to the person it describes. This edits the facts; each variant's
 * Design panel decides which of them actually get drawn, so the same details can
 * head up a client-facing CV and be absent from the ATS one.
 */
export function BrandingEditor() {
  const branding = useStore((s) => s.profile.branding)
  const updateBranding = useStore((s) => s.updateBranding)
  const variants = useStore((s) => s.variants)
  const updateVariantTheme = useStore((s) => s.updateVariantTheme)
  const fileInput = useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = useState('')

  // Same reasoning as the avatar upload: only a data URL survives a JSON export
  // and a reload, and only a downscaled one fits in localStorage.
  const readFile = async (file: File) => {
    try {
      updateBranding({ logo: await fileToAvatarDataUrl(file) })
      setLogoError('')
    } catch {
      setLogoError(`Could not read ${file.name}.`)
    }
  }

  /** Push the brand colour into every variant's accent in one go. */
  const applyAccentEverywhere = () => {
    for (const v of variants) {
      updateVariantTheme(v.id, { accentColor: branding.accentColor })
    }
  }

  return (
    <SectionCard
      title="Issuer branding"
      description="The company issuing this CV. Fill it in here; each variant's Design panel chooses where it appears."
    >
      <Label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={branding.enabled}
          onCheckedChange={(v) => updateBranding({ enabled: v === true })}
        />
        Show issuer branding on this CV
      </Label>

      {branding.enabled && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Input
                value={branding.company}
                onChange={(e) => updateBranding({ company: e.target.value })}
                placeholder="137"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={branding.tagline}
                onChange={(e) => updateBranding({ tagline: e.target.value })}
                placeholder="A studio for Web3 founders"
              />
            </Field>
            <Field label="Website">
              <Input
                value={branding.url}
                onChange={(e) => updateBranding({ url: e.target.value })}
                placeholder="137.studio"
              />
            </Field>
            <Field label="Contact" hint="Shown in the footer strip.">
              <Input
                value={branding.contact}
                onChange={(e) => updateBranding({ contact: e.target.value })}
                placeholder="hello@137.studio"
              />
            </Field>
            <Field label="Prepared for" hint="The client this CV was sent to.">
              <Input
                value={branding.issuedFor}
                onChange={(e) => updateBranding({ issuedFor: e.target.value })}
                placeholder="Prepared for Acme Corp"
              />
            </Field>
            <Field label="Issue date">
              <Input
                value={branding.issuedDate}
                onChange={(e) => updateBranding({ issuedDate: e.target.value })}
                placeholder="July 2026"
              />
            </Field>
            <Field label="Reference" hint="Your own id for this document.">
              <Input
                value={branding.reference}
                onChange={(e) => updateBranding({ reference: e.target.value })}
                placeholder="REF 137-0042"
              />
            </Field>
            <Field label="Small print" hint="Shown in the footer strip.">
              <Input
                value={branding.note}
                onChange={(e) => updateBranding({ note: e.target.value })}
                placeholder="Confidential — not for redistribution"
              />
            </Field>
          </div>

          <div className="mt-5">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">
              Logo
            </span>
            <div className="flex flex-wrap items-start gap-3">
              {branding.logo && (
                <img
                  src={branding.logo}
                  alt={branding.logoAlt || 'Logo preview'}
                  className="size-16 shrink-0 rounded-md border bg-white object-contain p-1"
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
                  {branding.logo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => updateBranding({ logo: '' })}
                    >
                      <X />
                      Remove logo
                    </Button>
                  )}
                </div>
                {branding.logo.startsWith('data:') ? (
                  // A base64 blob in a text box is unreadable and un-editable.
                  <p className="text-xs text-muted-foreground">
                    Uploaded image embedded in the profile.
                  </p>
                ) : (
                  <Input
                    value={branding.logo}
                    placeholder="…or paste an image URL"
                    onChange={(e) => updateBranding({ logo: e.target.value })}
                  />
                )}
                {logoError && (
                  <p className="text-xs text-destructive">{logoError}</p>
                )}
                <Input
                  value={branding.logoAlt}
                  placeholder="Alt text (137 logo)"
                  onChange={(e) => updateBranding({ logoAlt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Field
              label="Brand color"
              hint="The issuer's color. Applying it sets the accent on every variant — headings, links and item titles follow it."
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  aria-label="Brand color"
                  // A bare color input is fine here: unlike the theme's colors
                  // this one has no "unset" state to represent.
                  value={branding.accentColor || '#000000'}
                  onChange={(e) =>
                    updateBranding({ accentColor: e.target.value })
                  }
                  className="size-9 shrink-0 cursor-pointer rounded border bg-transparent"
                />
                <Input
                  className="w-32"
                  value={branding.accentColor}
                  placeholder="#2b5d80"
                  onChange={(e) =>
                    updateBranding({ accentColor: e.target.value })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!branding.accentColor || !variants.length}
                  onClick={applyAccentEverywhere}
                >
                  Apply to all variants
                </Button>
              </div>
            </Field>
          </div>
        </>
      )}
    </SectionCard>
  )
}
