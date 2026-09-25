import { useRef, useState } from 'react'
import { LANGUAGES, languageInfo, type LanguageInfo } from '@/lib/i18n'
import type { TValue } from '@/lib/translate'
import { translateTexts, type TranslateProgress } from '@/lib/ai/translate'
import { PROVIDERS } from '@/lib/ai/providers'
import { useAi } from '@/store/useAi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSelect({
  value,
  onChange,
  exclude,
  className,
}: {
  value: string
  onChange: (code: string) => void
  /** A language not worth offering, e.g. the one being translated from. */
  exclude?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.filter((l) => l.code !== exclude).map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.native}
            {l.native !== l.name && (
              <span className="text-muted-foreground"> · {l.name}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Runs an AI translation with the visitor's connected provider, tracking
 * progress and errors for the button that started it.
 */
export function useAiTranslate() {
  const connected = useAi((s) => Boolean(s.provider && s.keys[s.provider]))
  const openAssistant = useAi((s) => s.setOpen)
  const [progress, setProgress] = useState<TranslateProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  const run = async (
    language: string,
    source: Record<string, TValue>,
  ): Promise<Record<string, TValue> | null> => {
    const { provider, keys, models } = useAi.getState()
    const key = provider ? keys[provider] : undefined
    if (!provider || !key) return null
    const lang: LanguageInfo = languageInfo(language)
    controller.current = new AbortController()
    setError(null)
    setProgress({ done: 0, total: 1 })
    try {
      return await translateTexts(
        {
          provider,
          key,
          model: models[provider] ?? PROVIDERS[provider].defaultModel,
        },
        lang,
        source,
        controller.current.signal,
        setProgress,
      )
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      if (!aborted)
        setError(err instanceof Error ? err.message : 'Something went wrong.')
      return null
    } finally {
      controller.current = null
      setProgress(null)
    }
  }

  return {
    connected,
    /** Opens the assistant panel, which shows the connect screen. */
    connect: () => openAssistant(true),
    running: progress !== null,
    progress,
    error,
    run,
    cancel: () => controller.current?.abort(),
  }
}

/** "Translating… 2/3" while batches run. */
export function progressLabel(p: TranslateProgress | null): string {
  if (!p) return ''
  return p.total > 1 ? `Translating… ${p.done}/${p.total}` : 'Translating…'
}
