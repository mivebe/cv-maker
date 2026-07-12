import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Light/dark mode for the app chrome.
 *
 * Deliberately NOT called "theme": in this codebase a theme is a CV's
 * ThemeConfig (see schema/variant.ts). This only ever touches app chrome - the
 * CV document renders on white paper in both modes, because that is what it
 * prints as.
 *
 * A per-device preference, so it lives outside the profile store and never
 * rides along in import/export.
 */

export type Appearance = 'light' | 'dark' | 'system'

export const APPEARANCE_KEY = 'cv-maker:appearance:v1'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolveAppearance(mode: Appearance): 'light' | 'dark' {
  if (mode !== 'system') return mode
  return darkQuery().matches ? 'dark' : 'light'
}

/** The single place the `dark` class is switched on. */
function applyAppearance(mode: Appearance): void {
  const dark = resolveAppearance(mode) === 'dark'
  document.documentElement.classList.toggle('dark', dark)
}

interface AppearanceState {
  mode: Appearance
  setMode: (mode: Appearance) => void
}

export const useAppearance = create<AppearanceState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyAppearance(mode)
        set({ mode })
      },
    }),
    {
      name: APPEARANCE_KEY,
      version: 1,
      // The inline script in index.html has already set the class from this
      // same key; re-applying keeps us correct if that script ever fails.
      onRehydrateStorage: () => (state) =>
        applyAppearance(state?.mode ?? 'system'),
    },
  ),
)

/**
 * Keep `system` honest when the OS flips appearance mid-session.
 * Call once at app start; returns an unsubscribe.
 */
export function watchSystemAppearance(): () => void {
  const mq = darkQuery()
  const onChange = () => {
    if (useAppearance.getState().mode === 'system') applyAppearance('system')
  }
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
