import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { resolveVariant } from '../lib/resolve'
import { CVPreview } from '../cv/CVPreview'
import { VariantMetaEditor } from '../components/variant/VariantMetaEditor'
import { SectionOrderEditor } from '../components/variant/SectionOrderEditor'
import { IncludeOverrideEditor } from '../components/variant/IncludeOverrideEditor'
import { ThemeEditor } from '../components/variant/ThemeEditor'
import { ExportButton } from '../components/variant/ExportButton'
import { AtsPanel } from '../components/variant/AtsPanel'

type Tab = 'content' | 'design' | 'ats'

export function VariantEditorPage() {
  const { id } = useParams<{ id: string }>()
  const variant = useStore((s) => s.variants.find((v) => v.id === id))
  const profile = useStore((s) => s.profile)
  const docRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('content')

  if (!variant) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Variant not found.</p>
        <Link to="/variants" className="mt-2 inline-block text-blue-600">
          ← Back to variants
        </Link>
      </div>
    )
  }

  const cv = resolveVariant(profile, variant)

  const tabClass = (t: Tab) =>
    [
      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
      tab === t
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100',
    ].join(' ')

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between gap-4">
        <div>
          <Link to="/variants" className="text-sm text-blue-600">
            ← Variants
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{variant.name}</h1>
        </div>
        <ExportButton
          docRef={docRef}
          documentTitle={`${profile.basics.name || 'CV'} - ${variant.name}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="no-print space-y-4">
          <div className="flex gap-2">
            <button className={tabClass('content')} onClick={() => setTab('content')}>
              Content
            </button>
            <button className={tabClass('design')} onClick={() => setTab('design')}>
              Design
            </button>
            <button className={tabClass('ats')} onClick={() => setTab('ats')}>
              ATS
            </button>
          </div>

          {tab === 'content' && (
            <div className="space-y-4">
              <VariantMetaEditor variant={variant} />
              <SectionOrderEditor variant={variant} />
              <IncludeOverrideEditor variant={variant} />
            </div>
          )}
          {tab === 'design' && <ThemeEditor variant={variant} />}
          {tab === 'ats' && <AtsPanel cv={cv} theme={variant.theme} />}
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="no-print mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Live preview
          </div>
          <CVPreview ref={docRef} cv={cv} theme={variant.theme} />
        </div>
      </div>
    </div>
  )
}
