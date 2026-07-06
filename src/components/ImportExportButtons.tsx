import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { downloadJson, importJson } from '../lib/io'
import { APP_DATA_VERSION } from '../schema'

export function ImportExportButtons() {
  const profile = useStore((s) => s.profile)
  const variants = useStore((s) => s.variants)
  const replaceAll = useStore((s) => s.replaceAll)
  const resetToSample = useStore((s) => s.resetToSample)
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const flash = (msg: string, isError = false) => {
    setError(isError ? msg : null)
    setMessage(isError ? null : msg)
    window.setTimeout(() => {
      setMessage(null)
      setError(null)
    }, 4000)
  }

  const onExport = () => {
    downloadJson({ version: APP_DATA_VERSION, profile, variants })
    flash('Exported cv-data.json')
  }

  const onPickFile = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same filename
    if (!file) return
    const text = await file.text()
    const result = importJson(text)
    if (!result.ok) {
      flash(result.error, true)
      return
    }
    replaceAll(result.data)
    flash(
      `Imported ${result.data.variants.length} variant(s) and profile.`,
    )
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-xs font-medium text-green-700">{message}</span>
      )}
      {error && (
        <span className="max-w-xs truncate text-xs font-medium text-red-600" title={error}>
          {error}
        </span>
      )}
      <button
        onClick={onExport}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Export JSON
      </button>
      <button
        onClick={onPickFile}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Import JSON
      </button>
      <button
        onClick={() => {
          if (
            confirm('Replace all current data with the built-in sample?')
          ) {
            resetToSample()
            flash('Loaded sample data.')
          }
        }}
        className="rounded-md px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
        title="Reset to sample data"
      >
        Reset
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFile}
      />
    </div>
  )
}
