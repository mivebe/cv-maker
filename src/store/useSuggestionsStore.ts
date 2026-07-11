import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SuggestionKind } from '../lib/suggestions'

/**
 * Suggestions the user added themselves via "Add to suggestions".
 *
 * Deliberately a separate store from the profile: these are a per-device
 * vocabulary, not CV content, so they must not ride along in profile
 * import/export (see lib/io.ts).
 */

type Pools = Record<SuggestionKind, string[]>

const EMPTY_POOLS: Pools = {
  skill: [],
  skillGroup: [],
  role: [],
  organization: [],
  degree: [],
  institution: [],
  location: [],
  linkLabel: [],
}

interface SuggestionsState {
  /** Newest first, so recent additions surface at the top of the list. */
  user: Pools
  addSuggestion: (kind: SuggestionKind, value: string) => void
  removeSuggestion: (kind: SuggestionKind, value: string) => void
  clearSuggestions: () => void
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set) => ({
      user: EMPTY_POOLS,

      addSuggestion: (kind, value) =>
        set((s) => {
          const v = value.trim()
          if (!v) return s
          const existing = s.user[kind] ?? []
          if (existing.some((x) => x.toLowerCase() === v.toLowerCase()))
            return s
          return { user: { ...s.user, [kind]: [v, ...existing] } }
        }),

      removeSuggestion: (kind, value) =>
        set((s) => ({
          user: {
            ...s.user,
            [kind]: (s.user[kind] ?? []).filter(
              (x) => x.toLowerCase() !== value.trim().toLowerCase(),
            ),
          },
        })),

      clearSuggestions: () => set({ user: EMPTY_POOLS }),
    }),
    {
      name: 'cv-maker:suggestions:v1',
      version: 1,
      // Guards against pools missing a kind added in a later release.
      merge: (persisted, current) => {
        const p = persisted as Partial<SuggestionsState> | undefined
        return {
          ...current,
          user: { ...EMPTY_POOLS, ...(p?.user ?? {}) },
        }
      },
    },
  ),
)
