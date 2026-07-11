import { useNavigate } from 'react-router-dom'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { EmptyHint } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
          <h1 className="text-2xl font-bold tracking-tight">Variants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role-specific CVs built from your master profile. Each one picks its
            own sections, ordering, wording, and design.
          </p>
        </div>
        <Button variant="default" onClick={onCreate}>
          <Plus />
          New variant
        </Button>
      </div>

      {variants.length === 0 && (
        <EmptyHint>
          No variants yet. Create one to tailor your CV for a specific role.
        </EmptyHint>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <CardHeader>
              <button
                onClick={() => navigate(`/variant/${v.id}`)}
                className="text-left"
              >
                <CardTitle className="hover:text-primary">{v.name}</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {v.targetRole || 'No target role set'}
                </CardDescription>
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {THEME_PRESET_LABELS[v.theme.preset]}
              </p>
            </CardContent>
            <CardFooter className="mt-auto flex items-center gap-2 border-t pt-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/variant/${v.id}`)}
              >
                <Pencil />
                Edit
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const id = duplicateVariant(v.id)
                  if (id) navigate(`/variant/${id}`)
                }}
              >
                <Copy />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                className="ml-auto"
                onClick={() => {
                  if (confirm(`Delete variant "${v.name}"?`))
                    deleteVariant(v.id)
                }}
              >
                <Trash2 />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
