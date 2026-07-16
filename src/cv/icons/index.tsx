import { useEffect, useSyncExternalStore } from 'react'
import {
  Award,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  Code,
  Cpu,
  ExternalLink,
  FileText,
  Folder,
  Gamepad2,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  Mail,
  MapPin,
  Palette,
  Phone,
  Rocket,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  User,
  Wrench,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  BRAND_ALIASES,
  BRAND_ICONS,
  getBrandPath,
  iconsSettled as brandPathsSettled,
  loadBrandPath,
  subscribeToPaths,
} from './brandSource'
import {
  getPackGlyph,
  loadPackGlyph,
  PACK_CANONICAL,
  PACK_COUNT,
  PACK_MANIFEST,
  packGlyphsSettled,
  parsePackRef,
  subscribeToPackGlyphs,
} from './packSource'

export { PACK_COUNT, PACK_LABELS } from './packSource'

/** Resolves once no glyph - brand or pack - is still loading (see brandSource). */
export async function iconsSettled(): Promise<void> {
  await Promise.all([brandPathsSettled(), packGlyphsSettled()])
}

/**
 * One icon vocabulary for the whole CV: brand glyphs (all ~3.7k of them, from
 * the swappable `brandSource` adapter), generic UI glyphs (lucide), and a
 * monogram fallback so *any* name resolves to something printable. An icon value
 * may also be an image URL or data URL, which is how a user drops in a logo the
 * fork does not ship.
 *
 * Brand paths are fetched on first draw rather than bundled - see brandSource.
 *
 * Icons are decorative: they are `aria-hidden`, they carry no text nodes, and
 * the ATS preset turns them off entirely - so they never reach the text layer a
 * parser reads out of the exported PDF.
 */

/** Generic (non-brand) icons, keyed by the name stored on profile items. */
const UI_ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  calendar: Calendar,
  globe: Globe,
  link: LinkIcon,
  'external-link': ExternalLink,
  briefcase: Briefcase,
  building: Building2,
  'graduation-cap': GraduationCap,
  'file-text': FileText,
  folder: Folder,
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  smartphone: Smartphone,
  gamepad: Gamepad2,
  palette: Palette,
  wrench: Wrench,
  boxes: Boxes,
  rocket: Rocket,
  sparkles: Sparkles,
  zap: Zap,
  star: Star,
  award: Award,
  user: User,
}

/**
 * Convenient spellings that map onto a canonical registry key. The brand ones
 * (`js`, `azure`, ...) ship with the icons themselves; these are for the generic
 * UI glyphs, which have no package to carry them. A UI name always wins - the
 * fork has ~3.7k slugs and we do not want one of them shadowing `mail`.
 */
const ALIASES: Record<string, string> = {
  email: 'mail',
  location: 'map-pin',
  pin: 'map-pin',
  date: 'calendar',
  web: 'globe',
  website: 'globe',
}

export type IconResolution =
  | { kind: 'brand'; slug: string; hex: string; title: string }
  | { kind: 'pack'; pack: string; name: string }
  | { kind: 'ui'; Comp: LucideIcon }
  | { kind: 'image'; src: string }
  | { kind: 'monogram'; text: string; hex: string }
  | { kind: 'none' }

function isImageRef(name: string): boolean {
  return (
    name.startsWith('data:') ||
    name.startsWith('http://') ||
    name.startsWith('https://') ||
    name.startsWith('/')
  )
}

/** Stable pastel-ish brand color for a name we have no real glyph for. */
function monogramColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} 62% 46%)`
}

function monogramText(seed: string): string {
  const words = seed.split(/[^a-z0-9]+/i).filter(Boolean)
  if (!words.length) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Resolve an icon name to something renderable. Unknown names deliberately fall
 * back to a monogram instead of disappearing, so a typo - or a brand even the
 * fork does not have - still prints a sensible mark.
 */
export function resolveIcon(nameRaw: string): IconResolution {
  const name = nameRaw.trim()
  if (!name) return { kind: 'none' }
  if (isImageRef(name)) return { kind: 'image', src: name }

  // Pack refs are prefixed (`fa:house`, `entypo:mail`), so they can never
  // shadow a UI glyph or a brand slug.
  const packRef = parsePackRef(name)
  if (packRef) return { kind: 'pack', pack: packRef.pack, name: packRef.name }

  const key = name.toLowerCase()

  // UI glyphs first: they are the small, curated set, and their names must not
  // be shadowed by a brand slug.
  const uiKey = ALIASES[key] ?? key
  const ui = UI_ICONS[uiKey]
  if (ui) return { kind: 'ui', Comp: ui }

  const canonical = BRAND_ALIASES[key] ?? key.replace(/[\s._]+/g, '')
  const brand = BRAND_ICONS[canonical] ?? BRAND_ICONS[key]
  if (brand) {
    const slug = BRAND_ICONS[canonical] ? canonical : key
    return { kind: 'brand', slug, hex: `#${brand.hex}`, title: brand.title }
  }

  return {
    kind: 'monogram',
    text: monogramText(name),
    hex: monogramColor(name),
  }
}

export interface CVIconProps {
  name: string
  /** Rendered box size in px (the CV scales in pt/em, icons in px stay crisp). */
  size?: number
  /** Force the icon to inherit `currentColor` instead of its brand color. */
  mono?: boolean
  className?: string
}

export function CVIcon({
  name,
  size = 12,
  mono = false,
  className,
}: CVIconProps) {
  const icon = resolveIcon(name)
  const slug = icon.kind === 'brand' ? icon.slug : null
  const pack = icon.kind === 'pack' ? icon : null

  // Glyphs are cached module-side, so every <CVIcon> for the same icon shares
  // one fetch and they all re-render together when it lands.
  const path = useSyncExternalStore(subscribeToPaths, () =>
    slug ? getBrandPath(slug) : undefined,
  )
  const packGlyph = useSyncExternalStore(subscribeToPackGlyphs, () =>
    pack ? getPackGlyph(pack.pack, pack.name) : undefined,
  )

  // Pack names never contain "/", so the key round-trips losslessly.
  const packKey = pack ? `${pack.pack}/${pack.name}` : null
  useEffect(() => {
    if (slug) void loadBrandPath(slug)
    if (packKey) {
      const [p, n] = packKey.split('/')
      void loadPackGlyph(p, n)
    }
  }, [slug, packKey])

  const box = { width: size, height: size, flex: `0 0 ${size}px` } as const

  switch (icon.kind) {
    case 'none':
      return null

    case 'image':
      return (
        <img
          src={icon.src}
          alt=""
          aria-hidden
          className={`cv-icon cv-icon-img ${className ?? ''}`}
          style={box}
        />
      )

    case 'brand':
      // `undefined` = still fetching: hold the space rather than flash a
      // monogram we are about to replace. `null` = the fetch failed, so fall
      // back for real.
      if (path === undefined) {
        return (
          <span
            aria-hidden
            className={`cv-icon ${className ?? ''}`}
            style={box}
          />
        )
      }
      if (path === null) {
        return (
          <span
            aria-hidden
            className={`cv-icon cv-icon-mono ${className ?? ''}`}
            style={{
              ...box,
              background: mono ? 'currentColor' : icon.hex,
              fontSize: size * 0.52,
            }}
          >
            {monogramText(icon.title)}
          </span>
        )
      }
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          focusable="false"
          className={`cv-icon ${className ?? ''}`}
          style={{ ...box, fill: mono ? 'currentColor' : icon.hex }}
        >
          <path d={path} />
        </svg>
      )

    case 'pack':
      // Same three states as a brand glyph: hold space while fetching, fall
      // back to a monogram on failure. Packs are monochrome sets, so the fill
      // is always the surrounding text color - there is no brand hex.
      if (packGlyph === undefined) {
        return (
          <span
            aria-hidden
            className={`cv-icon ${className ?? ''}`}
            style={box}
          />
        )
      }
      if (packGlyph === null) {
        return (
          <span
            aria-hidden
            className={`cv-icon cv-icon-mono ${className ?? ''}`}
            style={{
              ...box,
              background: monogramColor(icon.name),
              fontSize: size * 0.52,
            }}
          >
            {monogramText(icon.name)}
          </span>
        )
      }
      return (
        <svg
          viewBox={packGlyph.viewBox}
          aria-hidden
          focusable="false"
          className={`cv-icon ${className ?? ''}`}
          style={{ ...box, fill: 'currentColor' }}
        >
          {packGlyph.paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      )

    case 'ui': {
      const { Comp } = icon
      return (
        <Comp
          aria-hidden
          focusable="false"
          className={`cv-icon ${className ?? ''}`}
          style={box}
          strokeWidth={2}
        />
      )
    }

    case 'monogram':
      return (
        <span
          aria-hidden
          className={`cv-icon cv-icon-mono ${className ?? ''}`}
          style={{
            ...box,
            background: mono ? 'currentColor' : icon.hex,
            fontSize: size * 0.52,
          }}
        >
          {icon.text}
        </span>
      )
  }
}

/**
 * The picker's default view: a short, hand-ordered set of the icons a CV
 * actually reaches for. Everything else in the fork is one search away.
 */
export const ICON_GROUPS: { label: string; names: string[] }[] = [
  {
    label: 'Contact & links',
    names: [
      'mail',
      'phone',
      'map-pin',
      'globe',
      'link',
      'external-link',
      'github',
      'linkedin',
      'slack',
      'pastebin',
      'sketchfab',
    ],
  },
  {
    label: 'Sections',
    names: [
      'briefcase',
      'building',
      'graduation-cap',
      'calendar',
      'file-text',
      'folder',
      'code',
      'terminal',
      'user',
      'star',
      'award',
      'boxes',
      'rocket',
      'sparkles',
      'zap',
      'cpu',
      'smartphone',
      'gamepad',
      'palette',
      'wrench',
    ],
  },
  {
    label: 'Tech',
    names: [
      'javascript',
      'typescript',
      'html5',
      'css',
      'react',
      'nextdotjs',
      'nodedotjs',
      'nestjs',
      'expo',
      'threedotjs',
      'pixijs',
      'spine',
      'gsap',
      'java',
      'openai',
      'amazons3',
      'microsoftazure',
      'visualstudiocode',
      'adobeanimate',
    ],
  },
  {
    label: 'Font Awesome & Entypo',
    names: [
      'fa:house',
      'fa:envelope',
      'fa:location-dot',
      'fa:graduation-cap',
      'fa:briefcase',
      'fa:code',
      'fa:trophy',
      'fa:language',
      'fa:certificate',
      'far:file-lines',
      'far:lightbulb',
      'fab:github',
      'entypo:tools',
      'entypo:globe',
      'entypo:mail',
      'entypo:trophy',
      'entypo:rocket',
      'entypo:graduation-cap',
    ],
  },
]

/** How many brands the fork currently ships - shown in the picker. */
export const BRAND_COUNT = Object.keys(BRAND_ICONS).length

/** Everything searchable: UI glyphs + brands + the monochrome packs. */
export const SEARCHABLE_COUNT =
  Object.keys(UI_ICONS).length + BRAND_COUNT + PACK_COUNT

/**
 * Search every icon the app can draw: the UI glyphs, all ~3.7k brands (by
 * slug, human title and alias), and the Font Awesome / Entypo packs (by name,
 * with or without their `fa:` / `entypo:` prefix). Ranked so that an exact hit
 * and a prefix hit beat a substring buried in the middle of a name.
 */
export function searchIcons(query: string, limit = 120): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const scored: { name: string; score: number }[] = []

  const consider = (name: string, haystacks: string[]) => {
    let best = 0
    for (const h of haystacks) {
      if (h === q) best = Math.max(best, 3)
      else if (h.startsWith(q)) best = Math.max(best, 2)
      else if (h.includes(q)) best = Math.max(best, 1)
    }
    if (best) scored.push({ name, score: best })
  }

  for (const name of Object.keys(UI_ICONS)) consider(name, [name])

  const aliasesOf: Record<string, string[]> = {}
  for (const [alias, slug] of Object.entries(BRAND_ALIASES)) {
    ;(aliasesOf[slug] ??= []).push(alias)
  }

  for (const [slug, meta] of Object.entries(BRAND_ICONS)) {
    consider(slug, [slug, meta.title.toLowerCase(), ...(aliasesOf[slug] ?? [])])
  }

  for (const [route, names] of Object.entries(PACK_MANIFEST)) {
    const prefix = PACK_CANONICAL[route]
    for (const name of names) {
      // Matches "house", "fa:house" and "house icon"-style word queries.
      consider(`${prefix}:${name}`, [
        name,
        name.replace(/-/g, ' '),
        `${prefix}:${name}`,
      ])
    }
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.name.length - b.name.length ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit)
    .map((s) => s.name)
}
