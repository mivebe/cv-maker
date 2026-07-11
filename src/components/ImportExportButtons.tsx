import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'
import { downloadJson, importJson } from '../lib/io'
import { APP_DATA_VERSION } from '../schema'
import { Button } from '@/components/ui/button'

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
    flash(`Imported ${result.data.variants.length} variant(s) and profile.`)
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-xs font-medium text-muted-foreground">
          {message}
        </span>
      )}
      {error && (
        <span
          className="max-w-xs truncate text-xs font-medium text-destructive"
          title={error}
        >
          {error}
        </span>
      )}
      <Button variant="outline" onClick={onExport}>
        <Download />
        Export JSON
      </Button>
      <Button variant="outline" onClick={onPickFile}>
        <Upload />
        Import JSON
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Reset to sample data"
        title="Reset to sample data"
        onClick={() => {
          if (confirm('Replace all current data with the built-in sample?')) {
            resetToSample()
            flash('Loaded sample data.')
          }
        }}
      >
        <RotateCcw />
      </Button>
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
