import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * The last few photos the user uploaded or linked, so switching back to a
 * previous portrait doesn't mean finding the file again.
 *
 * A per-device convenience like the color history, not CV content, so it lives
 * outside the profile store and never rides along in import/export.
 */

export const AVATAR_HISTORY_SIZE = 6

/**
 * Ceiling on the characters of data URL we keep here, well under the ~5MB
 * localStorage quota the profile itself has to fit in. Uploads arrive already
 * downscaled (see `fileToAvatarDataUrl`), so this only bites on hand-pasted
 * giants - and when it does we drop the oldest entries rather than let the
 * write fail and take the store with it.
 */
const BUDGET = 1_500_000

/** Newest first, deduped, within both the count and the size budget. */
function trimmed(list: string[]): string[] {
  const out: string[] = []
  let used = 0
  for (const src of list) {
    if (!src || out.includes(src)) continue
    if (out.length >= AVATAR_HISTORY_SIZE) break
    // Always keep the newest, however big: it is the one on the CV right now.
    if (out.length && used + src.length > BUDGET) break
    used += src.length
    out.push(src)
  }
  return out
}

interface AvatarHistoryState {
  /** Data URLs or remote image URLs, newest first. */
  recent: string[]
  rememberAvatar: (src: string) => void
  forgetAvatar: (src: string) => void
}

export const useAvatarHistory = create<AvatarHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      rememberAvatar: (src) =>
        set((s) => {
          const value = src.trim()
          if (!value || s.recent[0] === value) return s
          return { recent: trimmed([value, ...s.recent]) }
        }),
      forgetAvatar: (src) =>
        set((s) => ({ recent: s.recent.filter((v) => v !== src) })),
    }),
    {
      name: 'cv-maker:avatar-history:v1',
      version: 1,
      merge: (persisted, current) => {
        const p = persisted as Partial<AvatarHistoryState> | undefined
        return { ...current, recent: trimmed(p?.recent ?? []) }
      },
    },
  ),
)
