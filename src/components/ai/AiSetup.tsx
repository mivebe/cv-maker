import { useState } from 'react'
import { ExternalLink, KeyRound, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listModels, PROVIDERS, type ProviderId } from '../../lib/ai/providers'
import { startOpenRouterConnect } from '../../lib/ai/openrouterAuth'
import { useAi } from '../../store/useAi'

/**
 * First-run screen: pick a free provider. Nothing here costs the visitor or
 * the app owner money - OpenRouter is limited to its free models, and a Gemini
 * key from AI Studio sits on the free tier unless its owner enables billing.
 */

function ProviderCard({
  id,
  children,
}: {
  id: ProviderId
  children: React.ReactNode
}) {
  const p = PROVIDERS[id]
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="font-medium">{p.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{p.quota}</p>
      <div className="mt-2.5">{children}</div>
      <p className="mt-2 text-xs text-muted-foreground">{p.privacy}</p>
    </div>
  )
}

export function AiSetup() {
  const connect = useAi((s) => s.connect)
  const setupError = useAi((s) => s.setupError)
  const setSetupError = useAi((s) => s.setSetupError)
  const [geminiKey, setGeminiKey] = useState('')
  const [checking, setChecking] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const saveGemini = async () => {
    const key = geminiKey.trim()
    if (!key) return
    setChecking(true)
    setSetupError(null)
    try {
      // Listing models is free and proves the key works before we keep it.
      await listModels('gemini', key)
      connect('gemini', key)
    } catch (err) {
      setSetupError((err as Error).message)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3 sm:p-4">
      <div>
        <p className="font-medium">Use your own free AI account</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The assistant can write, rewrite and restyle your CVs - or invent a
          character's. It runs on your account with a free AI provider, called
          straight from this browser. Nothing goes through a CV Maker server,
          and your key never leaves this device.
        </p>
      </div>

      {setupError && (
        <p className="rounded-md bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          {setupError}
        </p>
      )}

      <ProviderCard id="openrouter">
        <Button
          className="w-full"
          disabled={redirecting}
          onClick={() => {
            setRedirecting(true)
            void startOpenRouterConnect()
          }}
        >
          {redirecting ? <Loader2 className="animate-spin" /> : <LogIn />}
          Connect OpenRouter
        </Button>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Sign in or create a free account; you come straight back here.
        </p>
      </ProviderCard>

      <ProviderCard id="gemini">
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            void saveGemini()
          }}
        >
          <Input
            type="password"
            autoComplete="off"
            placeholder="Paste a Gemini API key"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            aria-label="Gemini API key"
          />
          <Button type="submit" disabled={!geminiKey.trim() || checking}>
            {checking ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Save
          </Button>
        </form>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Get a free key in Google AI Studio <ExternalLink className="size-3" />
        </a>
      </ProviderCard>
    </div>
  )
}
