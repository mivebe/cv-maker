import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEME_PRESETS } from '../cv/themes'

/**
 * The last few colors the user picked, shared by every color field.
 *
 * A per-device convenience like the suggestion pools, not CV content, so it
 * lives outside the profile store and never rides along in import/export.
 */

export const COLOR_HISTORY_SIZE = 5

/** `#abc` and `#AABBCC` are the same pick; anything else isn't a hex color. */
export function normalizeHex(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  if (/^#[0-9a-f]{3}$/.test(v))
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  return null
}

/**
 * The row is never empty: before the user has picked anything it holds the
 * colors the presets already ship with, so getting back to a stock accent or
 * the neutral body text is always one click away. Real picks push these out.
 */
export const DEFAULT_COLORS: string[] = dedupe([
  ...Object.values(THEME_PRESETS).map((t) => t.accentColor),
  ...Object.values(THEME_PRESETS).map((t) => t.badgeColor),
  ...Object.values(THEME_PRESETS).map((t) => t.textColor),
]).slice(0, COLOR_HISTORY_SIZE)

function dedupe(colors: string[]): string[] {
  const out: string[] = []
  for (const c of colors) {
    const hex = normalizeHex(c)
    if (hex && !out.includes(hex)) out.push(hex)
  }
  return out
}

/** Top up a short history with defaults so the row always shows five swatches. */
function padded(recent: string[]): string[] {
  return dedupe([...recent, ...DEFAULT_COLORS]).slice(0, COLOR_HISTORY_SIZE)
}

interface ColorHistoryState {
  /** Newest first, deduped, exactly COLOR_HISTORY_SIZE entries. */
  recent: string[]
  rememberColor: (value: string) => void
}

export const useColorHistory = create<ColorHistoryState>()(
  persist(
    (set) => ({
      recent: DEFAULT_COLORS,
      rememberColor: (value) =>
        set((s) => {
          const hex = normalizeHex(value)
          if (!hex || s.recent[0] === hex) return s
          return { recent: padded([hex, ...s.recent.filter((c) => c !== hex)]) }
        }),
    }),
    {
      name: 'cv-maker:color-history:v1',
      version: 1,
      // A history saved before the defaults existed (or a short one) gets topped
      // up on load rather than rendering a half-empty row.
      merge: (persisted, current) => {
        const p = persisted as Partial<ColorHistoryState> | undefined
        return { ...current, recent: padded(p?.recent ?? []) }
      },
    },
  ),
)
