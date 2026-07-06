import { useRef, useState } from 'react'
import type { ResolvedCV } from '../../lib/resolve'
import type { ThemeConfig } from '../../schema'
import {
  atsChecks,
  atsLinearText,
  validateExtraction,
  type AtsCheck,
} from '../../lib/ats'
import { Button, SectionCard } from '../ui'

function CheckIcon({ level }: { level: AtsCheck['level'] }) {
  const map = {
    pass: { icon: '✓', cls: 'text-green-600' },
    warn: { icon: '!', cls: 'text-amber-500' },
    fail: { icon: '✕', cls: 'text-red-600' },
  }
  const { icon, cls } = map[level]
  return <span className={`font-bold ${cls}`}>{icon}</span>
}

function CheckList({ checks }: { checks: AtsCheck[] }) {
  return (
    <ul className="space-y-1.5">
      {checks.map((c, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <CheckIcon level={c.level} />
          <span>
            <span className="text-slate-700">{c.label}</span>
            {c.detail && (
              <span className="block text-xs text-slate-400">{c.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function AtsPanel({
  cv,
  theme,
}: {
  cv: ResolvedCV
  theme: ThemeConfig
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [extraction, setExtraction] = useState<{
    checks: AtsCheck[]
    charCount: number
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)

  const structural = atsChecks(cv, theme)
  const linear = atsLinearText(cv)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    setExtraction(null)
    try {
      // Lazy-load pdf.js only when actually verifying a PDF; it's a heavy dep.
      const { extractPdfText } = await import('../../lib/pdfExtract')
      const text = await extractPdfText(file)
      setExtraction(validateExtraction(cv, text))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      title="ATS check"
      description="Predicts how cleanly this CV parses, and verifies an exported PDF extracts to structured text."
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Structural checks
      </h3>
      <CheckList checks={structural} />

      <div className="mt-3">
        <button
          onClick={() => setShowText((s) => !s)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {showText ? 'Hide' : 'Show'} what an ATS reads (linear text)
        </button>
        {showText && (
          <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
            {linear}
          </pre>
        )}
      </div>

      <hr className="my-4 border-slate-100" />

      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Verify exported PDF
      </h3>
      <p className="mb-2 text-xs text-slate-500">
        Export the PDF (Save as PDF in the print dialog), then load it here to
        confirm the text extracts correctly.
      </p>
      <Button onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? 'Reading…' : 'Load exported PDF'}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onFile}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {extraction && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-slate-500">
            Extracted {extraction.charCount.toLocaleString()} characters.
          </p>
          <CheckList checks={extraction.checks} />
        </div>
      )}
    </SectionCard>
  )
}
