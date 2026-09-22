import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Which page `/` lands on. A per-device preference, like appearance: it never
 * rides along in import/export.
 *
 * `last` remembers the route you were on, including a variant editor. A
 * remembered variant that has since been deleted is harmless - that page says
 * "Variant not found" and offers the way back.
 */

export type StartPage = 'profile' | 'variants' | 'last'

/**
 * Only real routes are worth remembering. Without this, a typo'd hash would be
 * recorded and then redirected back to by `/`, which the catch-all would bounce
 * straight back again.
 */
const KNOWN_ROUTE = /^\/(profile|variants|variant\/[^/]+)$/

interface StartPageState {
  mode: StartPage
  /** The most recent route, recorded only so `last` has something to open. */
  lastPath: string
  setMode: (mode: StartPage) => void
  remember: (path: string) => void
}

export const useStartPage = create<StartPageState>()(
  persist(
    (set) => ({
      mode: 'profile',
      lastPath: '/profile',
      setMode: (mode) => set({ mode }),
      remember: (path) =>
        set((s) =>
          s.lastPath === path || !KNOWN_ROUTE.test(path)
            ? s
            : { lastPath: path },
        ),
    }),
    { name: 'cv-maker:start-page:v1', version: 1 },
  ),
)

/** Where `/` should send you right now. */
export function startPath(): string {
  const { mode, lastPath } = useStartPage.getState()
  if (mode === 'profile') return '/profile'
  if (mode === 'variants') return '/variants'
  return KNOWN_ROUTE.test(lastPath) ? lastPath : '/profile'
}
