import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Languages, Sparkles } from 'lucide-react'
import type { CVVariant } from '@/schema'
import { useStore } from '@/store/useStore'
import { DEFAULT_LANGUAGE } from '@/lib/i18n'
import { translationEntries, type TValue } from '@/lib/translate'
import { Field } from '@/components/app-ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LanguageSelect, progressLabel, useAiTranslate } from './translation'

/**
 * "Make this variant in another language": copies the variant, then fills
 * the copy's text with an AI translation, or leaves it for manual work in the
 * Translation tab. The master profile is never touched.
 */
export function TranslateDialog({
  variant,
  size = 'default',
}: {
  variant: CVVariant
  /** Trigger size, to match the buttons it sits beside. */
  size?: 'default' | 'sm'
}) {
  const profile = useStore((s) => s.profile)
  const addTranslatedVariant = useStore((s) => s.addTranslatedVariant)
  const navigate = useNavigate()
  const ai = useAiTranslate()
  const from = variant.language ?? DEFAULT_LANGUAGE
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState(from === 'bg' ? 'en' : 'bg')

  const create = (values: Record<string, TValue>) => {
    const id = addTranslatedVariant(variant.id, language, values)
    if (!id) return
    setOpen(false)
    navigate(`/variant/${id}?tab=translation`)
  }

  const translate = async () => {
    // Translate what this variant prints, so its own tailoring carries over.
    const source = Object.fromEntries(
      translationEntries(profile, variant).map((e) => [e.key, e.current]),
    )
    const values = await ai.run(language, source)
    if (values) create(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) ai.cancel()
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size={size}>
          <Languages />
          Translate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Translate “{variant.name}”</DialogTitle>
          <DialogDescription>
            Creates a copy of this variant in another language, including your
            name in its script. Your master profile stays as it is.
          </DialogDescription>
        </DialogHeader>

        <Field label="Language">
          <LanguageSelect
            value={language}
            onChange={setLanguage}
            exclude={from}
          />
        </Field>

        {!ai.connected && (
          <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Connect a free AI provider to translate automatically, or create the
            copy and translate it yourself side by side.{' '}
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => {
                // The assistant panel would sit under this modal.
                setOpen(false)
                ai.connect()
              }}
            >
              Connect AI
            </button>
          </p>
        )}
        {ai.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {ai.error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={ai.running}
            onClick={() => create({})}
          >
            Copy without translating
          </Button>
          {ai.running ? (
            <Button variant="secondary" onClick={ai.cancel}>
              {progressLabel(ai.progress)} Cancel
            </Button>
          ) : (
            <Button disabled={!ai.connected} onClick={translate}>
              <Sparkles />
              Translate with AI
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
