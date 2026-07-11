import { useStore } from '../../store/useStore'
import { Field } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StringListEditor } from '../editors/StringListEditor'

/**
 * A single override control. Shows the master value as placeholder; typing
 * stores a per-variant override, and "Reset" clears it so the master value
 * flows through again.
 */
export function OverrideText({
  variantId,
  itemId,
  field,
  label,
  masterValue,
  override,
  multiline,
}: {
  variantId: string
  itemId: string
  field: string
  label: string
  masterValue: string
  override: Record<string, unknown> | undefined
  multiline?: boolean
}) {
  const setOverride = useStore((s) => s.setOverride)
  const clearOverride = useStore((s) => s.clearOverride)
  const has = override && field in override
  const value = has ? String(override[field] ?? '') : ''

  return (
    <Field
      label={
        (has ? `${label} (overridden)` : label) as string
      }
    >
      <div className="flex items-start gap-2">
        {multiline ? (
          <Textarea
            className="min-w-0 flex-1"
            value={value}
            placeholder={masterValue || '-'}
            onChange={(e) =>
              setOverride(variantId, itemId, field, e.target.value)
            }
          />
        ) : (
          <Input
            className="min-w-0 flex-1"
            value={value}
            placeholder={masterValue || '-'}
            onChange={(e) =>
              setOverride(variantId, itemId, field, e.target.value)
            }
          />
        )}
        {has && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => clearOverride(variantId, itemId, field)}
          >
            Reset
          </Button>
        )}
      </div>
    </Field>
  )
}

/** Override control for a string-array field (e.g. highlights). */
export function OverrideList({
  variantId,
  itemId,
  field,
  label,
  masterValue,
  override,
}: {
  variantId: string
  itemId: string
  field: string
  label: string
  masterValue: string[]
  override: Record<string, unknown> | undefined
}) {
  const setOverride = useStore((s) => s.setOverride)
  const clearOverride = useStore((s) => s.clearOverride)
  const has = override && field in override
  const value = has ? (override[field] as string[]) : masterValue

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">
          {label}
          {has && ' (overridden)'}
        </span>
        {has && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => clearOverride(variantId, itemId, field)}
          >
            Reset to master
          </Button>
        )}
      </div>
      <StringListEditor
        label=""
        values={value}
        addLabel="Add"
        onChange={(next) => setOverride(variantId, itemId, field, next)}
      />
    </div>
  )
}
