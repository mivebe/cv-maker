import { useStore } from '../../store/useStore'
import { Field, TextArea, TextInput, Button } from '../ui'
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

  const Input = multiline ? TextArea : TextInput
  return (
    <Field
      label={
        (has ? `${label} (overridden)` : label) as string
      }
    >
      <div className="flex items-start gap-2">
        <Input
          value={value}
          placeholder={masterValue || '-'}
          onChange={(e) =>
            setOverride(variantId, itemId, field, e.target.value)
          }
        />
        {has && (
          <Button
            variant="ghost"
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
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          {label}
          {has && ' (overridden)'}
        </span>
        {has && (
          <Button
            variant="ghost"
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
