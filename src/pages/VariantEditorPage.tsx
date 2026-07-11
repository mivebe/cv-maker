import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import { resolveVariant } from '../lib/resolve'
import { CVPreview } from '../cv/CVPreview'
import { VariantMetaEditor } from '../components/variant/VariantMetaEditor'
import { SectionOrderEditor } from '../components/variant/SectionOrderEditor'
import { IncludeOverrideEditor } from '../components/variant/IncludeOverrideEditor'
import { ThemeEditor } from '../components/variant/ThemeEditor'
import { ExportButton } from '../components/variant/ExportButton'
import { AtsPanel } from '../components/variant/AtsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function VariantEditorPage() {
  const { id } = useParams<{ id: string }>()
  const variant = useStore((s) => s.variants.find((v) => v.id === id))
  const profile = useStore((s) => s.profile)
  const docRef = useRef<HTMLDivElement>(null)

  if (!variant) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Variant not found.</p>
        <Link
          to="/variants"
          className="mt-2 inline-flex items-center gap-1 text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to variants
        </Link>
      </div>
    )
  }

  const cv = resolveVariant(profile, variant)

  return (
    <div>
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Link
            to="/variants"
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            <ArrowLeft className="size-4" />
            Variants
          </Link>
          <h1 className="truncate text-lg font-bold sm:text-xl">
            {variant.name}
          </h1>
        </div>
        <ExportButton
          docRef={docRef}
          documentTitle={`${profile.basics.name || 'CV'} - ${variant.name}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Controls */}
        <Tabs defaultValue="content" className="no-print min-w-0 space-y-4">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="ats">ATS</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <VariantMetaEditor variant={variant} />
            <SectionOrderEditor variant={variant} />
            <IncludeOverrideEditor variant={variant} />
          </TabsContent>
          <TabsContent value="design">
            <ThemeEditor variant={variant} />
          </TabsContent>
          <TabsContent value="ats">
            <AtsPanel cv={cv} theme={variant.theme} />
          </TabsContent>
        </Tabs>

        {/* Live preview */}
        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="no-print mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </div>
          <CVPreview ref={docRef} cv={cv} theme={variant.theme} />
        </div>
      </div>
    </div>
  )
}
