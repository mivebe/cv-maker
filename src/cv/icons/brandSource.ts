/**
 * THE ONLY FILE THAT IMPORTS THE BRAND-ICON PACKAGE.
 *
 * There is deliberately no import list here any more. The app bundles the
 * package's *manifest* - every one of its ~3.7k icons, title and brand color,
 * with no path data (~52 kB gzipped) - so every icon in the fork is pickable
 * the moment you `npm update`, with no code change in this repo.
 *
 * Path data is the other 2.1 MB gzipped, so it is NOT bundled. A glyph's path
 * is fetched from /brand-icons/<slug>.svg the first time something draws it
 * (see the `brandIcons` plugin in vite.config.ts) and cached forever after.
 */
import { manifest } from '@mivebe/icons/manifest'
import { aliases } from '@mivebe/icons/aliases'

/** What we know about a brand without having fetched its glyph. */
export interface BrandIcon {
  title: string
  /** Brand color, `RRGGBB` (no leading `#`). */
  hex: string
}

/** Every brand the fork ships, keyed by slug. Titles and colors only. */
export const BRAND_ICONS: Record<string, BrandIcon> = manifest

/** Alternate spellings (`js` -> `javascript`), shipped with the icon data. */
export const BRAND_ALIASES: Record<string, string> = aliases

/** slug -> path, or `null` once a fetch has definitively failed. */
const paths = new Map<string, string | null>()
const inFlight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

function announce() {
  for (const l of listeners) l()
}

/** Subscribe to path-cache changes (for `useSyncExternalStore`). */
export function subscribeToPaths(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * The cached path for a slug: a string once loaded, `null` if the fetch failed,
 * `undefined` if we have not fetched it yet. Never triggers a fetch itself -
 * `useSyncExternalStore` demands a side-effect-free snapshot.
 */
export function getBrandPath(slug: string): string | null | undefined {
  return paths.get(slug)
}

/** Fetch a glyph's path if we do not have it. Idempotent and safe to over-call. */
export function loadBrandPath(slug: string): Promise<void> {
  if (paths.has(slug)) return Promise.resolve()
  const existing = inFlight.get(slug)
  if (existing) return existing

  const load = (async () => {
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}brand-icons/${slug}.svg`,
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = /<path[^>]*\sd="([^"]+)"/.exec(await res.text())?.[1]
      paths.set(slug, d ?? null)
    } catch {
      // A brand we cannot fetch degrades to a monogram, same as an unknown name.
      paths.set(slug, null)
    } finally {
      inFlight.delete(slug)
      announce()
    }
  })()

  inFlight.set(slug, load)
  return load
}

/**
 * Resolves once no glyph is still loading.
 *
 * The print/PDF path needs this: `react-to-print` snapshots the live DOM, so an
 * icon whose path has not arrived would print as a monogram. Components kick
 * off their fetches in an effect, which React flushes before paint - so by the
 * time a user can click Export, the loads are in flight and this drains them.
 * The loop re-checks because one fetch can be queued behind another.
 */
export async function iconsSettled(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight.values()])
}
