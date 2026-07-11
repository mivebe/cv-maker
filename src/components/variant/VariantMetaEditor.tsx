import type { CVVariant } from '../../schema'
import { useStore } from '../../store/useStore'
import { Field, SectionCard } from '@/components/app-ui'
import { SuggestInput } from '@/components/SuggestInput'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
          <Input
            value={variant.name}
            onChange={(e) =>
              updateVariantMeta(variant.id, { name: e.target.value })
            }
          />
        </Field>
        <Field label="Target role">
          <Input
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
          <SuggestInput
            kind="role"
            value={variant.basicsOverride.headline ?? ''}
            placeholder={profile.basics.headline}
            onChange={(headline) =>
              updateVariantBasics(variant.id, {
                headline: headline || undefined,
              })
            }
          />
        </Field>
        <Field
          label="Summary override"
          hint="Leave blank to use the master summary."
        >
          <Textarea
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
