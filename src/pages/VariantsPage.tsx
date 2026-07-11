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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Variants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role-specific CVs built from your master profile. Each one picks its
            own sections, ordering, wording, and design.
          </p>
        </div>
        <Button variant="default" className="h-9 self-start" onClick={onCreate}>
          <Plus />
          New variant
        </Button>
      </div>

      {variants.length === 0 && (
        <EmptyHint>
          No variants yet. Create one to tailor your CV for a specific role.
        </EmptyHint>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {variants.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <CardHeader>
              <button
                onClick={() => navigate(`/variant/${v.id}`)}
                className="min-w-0 text-left"
              >
                <CardTitle className="truncate hover:text-primary">
                  {v.name}
                </CardTitle>
                <CardDescription className="mt-0.5 truncate text-xs">
                  {v.targetRole || 'No target role set'}
                </CardDescription>
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {THEME_PRESET_LABELS[v.theme.preset]}
              </p>
            </CardContent>
            <CardFooter className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
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
