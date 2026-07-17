import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store/useStore'
import { resolveVariant } from '../lib/resolve'
import { CVPreview } from '../cv/CVPreview'
import { VariantMetaEditor } from '../components/variant/VariantMetaEditor'
import { VariantSectionsEditor } from '../components/variant/VariantSectionsEditor'
import { ArrangeDialog } from '../components/variant/ArrangeDialog'
import { ThemeEditor } from '../components/variant/ThemeEditor'
import { VariantOptionDefaultsCard } from '../components/variant/VariantOptionsEditor'
import { ExportButton } from '../components/variant/ExportButton'
import { AtsPanel } from '../components/variant/AtsPanel'
import {
  HighlightProvider,
  useHighlightSurface,
} from '../components/variant/highlight'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function VariantEditorPage() {
  return (
    <HighlightProvider>
      <VariantEditor />
    </HighlightProvider>
  )
}

function VariantEditor() {
  const { id } = useParams<{ id: string }>()
  const variant = useStore((s) => s.variants.find((v) => v.id === id))
  const profile = useStore((s) => s.profile)
  const docRef = useRef<HTMLDivElement>(null)
  const surface = useHighlightSurface()

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
    <Tabs defaultValue="content" className="gap-0">
      {/* Sticky toolbar pinned right under the app header (whose rendered
          height Layout publishes as --app-header-h). Negative margins undo
          <main>'s padding so the bar spans edge to edge and content scrolls
          behind it, not past its sides. */}
      <div className="no-print sticky top-[var(--app-header-h,0px)] z-10 -mx-3 -mt-4 mb-4 flex flex-col gap-3 border-b bg-background/90 px-3 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
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
        {/* Tabs and Rearrange sit together on the left; Export keeps the far
            right. On mobile the tabs take their own row and the buttons wrap
            below them. */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:gap-3">
          <TabsList className="w-full group-data-horizontal/tabs:h-9 sm:w-fit">
            <TabsTrigger value="content" className="px-3">
              Content
            </TabsTrigger>
            <TabsTrigger value="design" className="px-3">
              Design
            </TabsTrigger>
            <TabsTrigger value="ats" className="px-3">
              ATS
            </TabsTrigger>
          </TabsList>
          <ArrangeDialog variant={variant} cv={cv} docRef={docRef} />
          <div className="ml-auto">
            <ExportButton
              docRef={docRef}
              documentTitle={`${profile.basics.name || 'CV'} - ${variant.name}`}
            />
          </div>
        </div>
      </div>

      {/* Each pane scrolls on its own from lg up, so the controls and the page
          they describe can be read side by side without dragging one another.
          On wide monitors the controls spread over two columns; the rightmost
          column always stays reserved for the live preview. */}
      <div className="grid gap-4 lg:h-[calc(100vh-12rem)] lg:grid-cols-2 lg:gap-1 3xl:grid-cols-3">
        {/* Controls */}
        <div
          // p-1 + negative margins: the pane is a scroll container from lg up,
          // and the hover-highlight outline draws 4px outside a card - without
          // breathing room on every edge the outline gets clipped off (left on
          // the pane edge, top against the sticky toolbar).
          className="hl-surface no-print min-w-0 lg:-mt-1 lg:-ml-1 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pt-1 lg:pr-2 lg:pb-1 lg:pl-1 3xl:col-span-2"
          {...surface}
        >
          {/* No multi-column flow here: the section cards are one draggable
              vertical list, and their order is the CV's section order. */}
          <TabsContent value="content" className="[&>*]:mb-4">
            <VariantMetaEditor variant={variant} />
            <VariantSectionsEditor variant={variant} />
          </TabsContent>
          <TabsContent
            value="design"
            className="[&>*]:mb-4 [&>*]:break-inside-avoid 3xl:columns-2 3xl:gap-6"
          >
            <ThemeEditor variant={variant} />
            <VariantOptionDefaultsCard variant={variant} />
          </TabsContent>
          <TabsContent value="ats">
            <AtsPanel cv={cv} theme={variant.theme} />
          </TabsContent>
        </div>

        {/* Live preview */}
        <div
          className="hl-surface min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1"
          {...surface}
        >
          <div className="no-print mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </div>
          <CVPreview ref={docRef} cv={cv} theme={variant.theme} />
        </div>
      </div>
    </Tabs>
  )
}
