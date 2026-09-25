import { memo, useMemo, useState } from 'react'
import { Check, RotateCcw, Sparkles } from 'lucide-react'
import type { CVVariant } from '@/schema'
import { useStore } from '@/store/useStore'
import { DEFAULT_LANGUAGE, languageInfo } from '@/lib/i18n'
import {
  translationEntries,
  type TranslationEntry,
  type TValue,
} from '@/lib/translate'
import { cn } from '@/lib/utils'
import { EmptyHint, Field, SectionCard } from '@/components/app-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LanguageSelect, progressLabel, useAiTranslate } from './translation'

const asText = (v: TValue) => (Array.isArray(v) ? v.join('\n') : v)

/**
 * The side-by-side translation view: every piece of text the variant prints,
 * master on the left and this variant's wording on the right. A translation
 * whose master text has changed since is flagged, and can be re-translated,
 * rewritten, or accepted as still correct.
 */
export function TranslationPanel({ variant }: { variant: CVVariant }) {
  const profile = useStore((s) => s.profile)
  const setTranslations = useStore((s) => s.setTranslations)
  const updateVariantMeta = useStore((s) => s.updateVariantMeta)
  const ai = useAiTranslate()
  const [onlyTodo, setOnlyTodo] = useState(false)
  const language = variant.language ?? DEFAULT_LANGUAGE

  const entries = useMemo(
    () => translationEntries(profile, variant),
    [profile, variant],
  )
  const todo = entries.filter((e) => !e.translated || e.outdated)
  const outdated = entries.filter((e) => e.outdated).length
  const shown = onlyTodo ? todo : entries

  const translateTodo = async () => {
    // An outdated field is re-translated from the new master text; a fresh
    // one from what the variant prints, so its tailoring carries over.
    const source = Object.fromEntries(
      todo.map((e) => [e.key, e.outdated ? e.master : e.current]),
    )
    const values = await ai.run(language, source)
    if (values) setTranslations(variant.id, values)
  }

  const groups = new Map<string, TranslationEntry[]>()
  for (const e of shown)
    groups.set(e.group, [...(groups.get(e.group) ?? []), e])

  return (
    <div className="space-y-4">
      <SectionCard
        title="Translation"
        description="The master text on the left, this variant's wording on the right. Anything left blank prints the master text."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Variant language">
            <LanguageSelect
              value={language}
              onChange={(code) =>
                updateVariantMeta(variant.id, { language: code })
              }
            />
          </Field>
          <div className="flex flex-col justify-end gap-1 text-xs text-muted-foreground">
            <span>
              {entries.length - todo.length + outdated} of {entries.length}{' '}
              fields translated
              {outdated > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}
                  · {outdated} outdated
                </span>
              )}
            </span>
            <span>
              Dates, “{languageInfo(language).present}” and language levels
              follow the variant language automatically.
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ai.running ? (
            <Button variant="secondary" onClick={ai.cancel}>
              {progressLabel(ai.progress)} Cancel
            </Button>
          ) : ai.connected ? (
            <Button disabled={todo.length === 0} onClick={translateTodo}>
              <Sparkles />
              {todo.length === 0
                ? 'Everything is translated'
                : `Translate ${todo.length} field${todo.length === 1 ? '' : 's'} with AI`}
            </Button>
          ) : (
            <Button variant="outline" onClick={ai.connect}>
              <Sparkles />
              Connect AI to translate automatically
            </Button>
          )}
          <Button
            variant="ghost"
            aria-pressed={onlyTodo}
            onClick={() => setOnlyTodo((v) => !v)}
          >
            {onlyTodo
              ? 'Show all fields'
              : `Show only what needs work (${todo.length})`}
          </Button>
        </div>
        {ai.error && (
          <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {ai.error}
          </p>
        )}
      </SectionCard>

      {shown.length === 0 && (
        <EmptyHint>
          {onlyTodo
            ? 'Nothing needs work: every field is translated and up to date.'
            : 'This variant prints no text yet.'}
        </EmptyHint>
      )}

      {[...groups].map(([group, list]) => (
        <SectionCard key={group} title={group}>
          <div className="divide-y">
            {list.map((e) => (
              <TranslationRow key={e.key} entry={e} variantId={variant.id} />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}

const TranslationRow = memo(function TranslationRow({
  entry,
  variantId,
}: {
  entry: TranslationEntry
  variantId: string
}) {
  const setTranslations = useStore((s) => s.setTranslations)
  const clearTranslation = useStore((s) => s.clearTranslation)
  const isList = Array.isArray(entry.master)
  const masterText = asText(entry.master)
  const value = entry.translated ? asText(entry.current) : ''

  const write = (raw: string) => {
    if (!raw.trim()) clearTranslation(variantId, entry.key)
    else
      setTranslations(variantId, {
        [entry.key]: isList ? raw.split('\n') : raw,
      })
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="mb-1.5 flex min-h-7 flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
          {entry.label}
          {isList && ' (one per line)'}
        </span>
        {entry.outdated && (
          <>
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-700 dark:text-amber-400"
            >
              Master changed
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              title="Keep this translation and stop flagging it"
              onClick={() =>
                setTranslations(variantId, { [entry.key]: entry.current })
              }
            >
              <Check />
              Still correct
            </Button>
          </>
        )}
        {entry.translated && (
          <Button
            variant="ghost"
            size="sm"
            title="Print the master text again"
            onClick={() => clearTranslation(variantId, entry.key)}
          >
            <RotateCcw />
            Reset
          </Button>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div
          className={cn(
            'rounded-md border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap text-muted-foreground',
            entry.outdated && 'border-amber-500/50',
          )}
        >
          {masterText}
        </div>
        <Textarea
          className="min-h-9"
          rows={Math.min(8, Math.max(1, masterText.split('\n').length))}
          value={value}
          placeholder={masterText}
          onChange={(e) => write(e.target.value)}
        />
      </div>
    </div>
  )
})
