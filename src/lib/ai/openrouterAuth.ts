/**
 * OpenRouter's "Connect" flow (OAuth PKCE), which gives a static site a key on
 * the visitor's own account without them ever copying one. We send them to
 * openrouter.ai/auth; they sign in and approve; OpenRouter redirects back with
 * `?code=` in the query (not the hash - the hash is the app's router), and the
 * code plus our verifier buys the key. The verifier lives in sessionStorage
 * only for the round trip.
 */

const VERIFIER_KEY = 'cv-maker:openrouter-verifier'

function base64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function callbackUrl(): string {
  return location.origin + import.meta.env.BASE_URL
}

export async function startOpenRouterConnect(): Promise<void> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  const challenge = base64url(new Uint8Array(digest))
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const params = new URLSearchParams({
    callback_url: callbackUrl(),
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  location.href = `https://openrouter.ai/auth?${params}`
}

/**
 * Finish a Connect round trip if this page load is one. Returns the new key,
 * null when the URL carries no code, or throws with a readable message.
 * The code is stripped from the address bar either way, so a reload cannot
 * replay it.
 */
export async function completeOpenRouterConnect(): Promise<string | null> {
  const url = new URL(location.href)
  const code = url.searchParams.get('code')
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!code || !verifier) return null

  url.searchParams.delete('code')
  history.replaceState(history.state, '', url.toString())
  sessionStorage.removeItem(VERIFIER_KEY)

  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        code_challenge_method: 'S256',
      }),
    })
  } catch {
    throw new Error('Could not reach OpenRouter to finish connecting.')
  }
  if (!res.ok)
    throw new Error(
      `OpenRouter did not accept the sign-in (error ${res.status}). Try connecting again.`,
    )
  const body = (await res.json()) as { key?: string }
  if (!body.key) throw new Error('OpenRouter returned no key. Try again.')
  return body.key
}
