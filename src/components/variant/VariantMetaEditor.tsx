import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { Field, SectionCard, TextArea, TextInput } from '../ui'

export function VariantMetaEditor({ variant }: { variant: CVVariant }) {
  const updateVariantMeta = useStore((s) => s.updateVariantMeta)
  const updateVariantBasics = useStore((s) => s.updateVariantBasics)
  const profile = useStore((s) => s.profile)

  return (
    <SectionCard
      title="Variant details"
      description="Name this variant and tailor the headline/summary for the target role."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Variant name">
          <TextInput
            value={variant.name}
            onChange={(e) => updateVariantMeta(variant.id, { name: e.target.value })}
          />
        </Field>
        <Field label="Target role">
          <TextInput
            value={variant.targetRole}
            placeholder="e.g. Backend Engineer at Acme"
            onChange={(e) =>
              updateVariantMeta(variant.id, { targetRole: e.target.value })
            }
          />
        </Field>
      </div>

      <div className="mt-4 space-y-4">
        <Field
          label="Headline override"
          hint={`Leave blank to use master: "${profile.basics.headline || '-'}"`}
        >
          <TextInput
            value={variant.basicsOverride.headline ?? ''}
            placeholder={profile.basics.headline}
            onChange={(e) =>
              updateVariantBasics(variant.id, {
                headline: e.target.value || undefined,
              })
            }
          />
        </Field>
        <Field
          label="Summary override"
          hint="Leave blank to use the master summary."
        >
          <TextArea
            value={variant.basicsOverride.summary ?? ''}
            placeholder={profile.basics.summary}
            onChange={(e) =>
              updateVariantBasics(variant.id, {
                summary: e.target.value || undefined,
              })
            }
          />
        </Field>
      </div>
    </SectionCard>
  )
}
