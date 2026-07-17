/**
 * Monochrome icon packs (Font Awesome Free, Entypo), the sibling of
 * brandSource: only the *names* are bundled (via the vite virtual manifest),
 * a glyph's SVG is fetched from /icon-packs/<pack>/<name>.svg the first time
 * something draws it and cached forever after.
 *
 * Unlike the brand set these are not 24x24 single-path files - each glyph
 * carries its own viewBox (FA is 512-based, Entypo 20-based) and may hold
 * several <path>s, so the cache stores both. They also have no brand color:
 * they render in `currentColor`.
 */
import { packManifest } from 'virtual:icon-pack-manifest'

/** A stored icon value's prefix -> the pack route it loads from. */
export const PACK_PREFIXES: Record<string, string> = {
  fa: 'fa-solid',
  fas: 'fa-solid',
  far: 'fa-regular',
  fab: 'fa-brands',
  entypo: 'entypo',
  en: 'entypo',
}

/** The canonical prefix per pack route (what search results are spelled with). */
export const PACK_CANONICAL: Record<string, string> = {
  'fa-solid': 'fa',
  'fa-regular': 'far',
  'fa-brands': 'fab',
  entypo: 'entypo',
}

export const PACK_LABELS: Record<string, string> = {
  'fa-solid': 'Font Awesome',
  'fa-regular': 'Font Awesome (regular)',
  'fa-brands': 'Font Awesome (brands)',
  entypo: 'Entypo',
}

const packSets: Record<string, Set<string>> = {}
for (const [route, names] of Object.entries(packManifest)) {
  packSets[route] = new Set(names)
}

export const PACK_MANIFEST: Record<string, string[]> = packManifest

export const PACK_COUNT = Object.values(packManifest).reduce(
  (sum, names) => sum + names.length,
  0,
)

export interface PackRef {
  /** Pack route, e.g. `fa-solid`. */
  pack: string
  /** Icon name inside the pack, e.g. `house`. */
  name: string
  /** The canonical stored spelling, e.g. `fa:house`. */
  slug: string
}

/**
 * Parse a stored icon value like `fa:house` / `entypo:mail`. Returns null for
 * anything that is not a known pack prefix + existing icon, so unknown values
 * fall through to the brand/monogram pipeline unchanged.
 */
export function parsePackRef(raw: string): PackRef | null {
  const i = raw.indexOf(':')
  if (i <= 0) return null
  const pack = PACK_PREFIXES[raw.slice(0, i).toLowerCase()]
  if (!pack) return null
  const name = raw
    .slice(i + 1)
    .trim()
    .toLowerCase()
  if (!packSets[pack]?.has(name)) return null
  return { pack, name, slug: `${PACK_CANONICAL[pack]}:${name}` }
}

export interface PackGlyph {
  viewBox: string
  paths: string[]
}

/** `${pack}/${name}` -> glyph, or `null` once a fetch has definitively failed. */
const glyphs = new Map<string, PackGlyph | null>()
const inFlight = new Map<string, Promise<void>>()
const listeners = new Set<() => void>()

function announce() {
  for (const l of listeners) l()
}

export function subscribeToPackGlyphs(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Side-effect-free snapshot for useSyncExternalStore; undefined = not fetched. */
export function getPackGlyph(
  pack: string,
  name: string,
): PackGlyph | null | undefined {
  return glyphs.get(`${pack}/${name}`)
}

export function loadPackGlyph(pack: string, name: string): Promise<void> {
  const key = `${pack}/${name}`
  if (glyphs.has(key)) return Promise.resolve()
  const existing = inFlight.get(key)
  if (existing) return existing

  const load = (async () => {
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}icon-packs/${pack}/${name}.svg`,
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const viewBox = /viewBox="([^"]+)"/.exec(text)?.[1]
      const paths = [...text.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map(
        (m) => m[1],
      )
      glyphs.set(key, viewBox && paths.length ? { viewBox, paths } : null)
    } catch {
      // Degrades to a monogram, same as an unknown name.
      glyphs.set(key, null)
    } finally {
      inFlight.delete(key)
      announce()
    }
  })()

  inFlight.set(key, load)
  return load
}

/** Resolves once no pack glyph is still loading (see iconsSettled). */
export async function packGlyphsSettled(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight.values()])
}
