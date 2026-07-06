import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button, EmptyHint } from '../components/ui'
import { THEME_PRESET_LABELS } from '../cv/themes'

export function VariantsPage() {
  const variants = useStore((s) => s.variants)
  const addVariant = useStore((s) => s.addVariant)
  const duplicateVariant = useStore((s) => s.duplicateVariant)
  const deleteVariant = useStore((s) => s.deleteVariant)
  const navigate = useNavigate()

  const onCreate = () => {
    const id = addVariant('New Variant')
    navigate(`/variant/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Variants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Role-specific CVs built from your master profile. Each one picks its
            own sections, ordering, wording, and design.
          </p>
        </div>
        <Button variant="primary" onClick={onCreate}>
          + New variant
        </Button>
      </div>

      {variants.length === 0 && (
        <EmptyHint>
          No variants yet. Create one to tailor your CV for a specific role.
        </EmptyHint>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((v) => (
          <div
            key={v.id}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <button
              onClick={() => navigate(`/variant/${v.id}`)}
              className="text-left"
            >
              <h3 className="font-semibold text-slate-900 hover:text-blue-600">
                {v.name}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {v.targetRole || 'No target role set'}
              </p>
            </button>
            <p className="mt-2 text-xs text-slate-400">
              {THEME_PRESET_LABELS[v.theme.preset]}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <Button onClick={() => navigate(`/variant/${v.id}`)}>Edit</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const id = duplicateVariant(v.id)
                  if (id) navigate(`/variant/${id}`)
                }}
              >
                Duplicate
              </Button>
              <Button
                variant="danger"
                className="ml-auto"
                onClick={() => {
                  if (confirm(`Delete variant "${v.name}"?`))
                    deleteVariant(v.id)
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
