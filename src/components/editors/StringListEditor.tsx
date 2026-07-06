import { TextInput, Button } from '../ui'

/**
 * Edits an ordered list of plain strings (bullet highlights, skill tags).
 * Operates on the whole array via onChange so callers can persist it in one
 * store update.
 */
export function StringListEditor({
  label,
  values,
  onChange,
  placeholder,
  addLabel = 'Add',
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  const update = (i: number, v: string) =>
    onChange(values.map((x, idx) => (idx === i ? v : x)))
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= values.length) return
    const next = values.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <TextInput
              value={v}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              title="Move up"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === values.length - 1}
              title="Move down"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => remove(i)}
              title="Remove"
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        className="mt-2"
        onClick={() => onChange([...values, ''])}
      >
        + {addLabel}
      </Button>
    </div>
  )
}
