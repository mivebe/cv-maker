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
import { BRAND_ICONS } from './brandSource'

/**
 * One icon vocabulary for the whole CV: brand glyphs (from the swappable
 * `brandSource` adapter), generic UI glyphs (lucide), and a monogram fallback so
 * *any* name resolves to something printable. An icon value may also be an image
 * URL or data URL, which is how a user drops in a logo we do not ship.
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

/** Convenient spellings that map onto a canonical registry key. */
const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  html: 'html5',
  'html/css': 'html5',
  node: 'nodedotjs',
  'node.js': 'nodedotjs',
  nodejs: 'nodedotjs',
  nest: 'nestjs',
  'nest.js': 'nestjs',
  next: 'nextdotjs',
  'next.js': 'nextdotjs',
  nextjs: 'nextdotjs',
  three: 'threedotjs',
  'three.js': 'threedotjs',
  threejs: 'threedotjs',
  'react-native': 'react',
  reactnative: 'react',
  rn: 'react',
  pixi: 'pixijs',
  'pixi.js': 'pixijs',
  spine2d: 'spine',
  'spine 2d': 'spine',
  email: 'mail',
  location: 'map-pin',
  pin: 'map-pin',
  date: 'calendar',
  web: 'globe',
  website: 'globe',
  in: 'linkedin',
}

export type IconResolution =
  | { kind: 'brand'; slug: string; hex: string; path: string; title: string }
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
 * Resolve an icon value to something renderable. Unknown names deliberately
 * fall back to a monogram instead of disappearing, so a typo or an
 * as-yet-unshipped brand still prints a sensible mark.
 */
export function resolveIcon(nameRaw: string): IconResolution {
  const name = nameRaw.trim()
  if (!name) return { kind: 'none' }
  if (isImageRef(name)) return { kind: 'image', src: name }

  const key = name.toLowerCase()
  const canonical = ALIASES[key] ?? key.replace(/[\s._]+/g, '')

  const brand = BRAND_ICONS[canonical] ?? BRAND_ICONS[key]
  if (brand) {
    return {
      kind: 'brand',
      slug: canonical,
      hex: `#${brand.hex}`,
      path: brand.path,
      title: brand.title,
    }
  }

  const ui = UI_ICONS[key] ?? UI_ICONS[canonical]
  if (ui) return { kind: 'ui', Comp: ui }

  return { kind: 'monogram', text: monogramText(name), hex: monogramColor(name) }
}

export interface CVIconProps {
  name: string
  /** Rendered box size in px (the CV scales in pt/em, icons in px stay crisp). */
  size?: number
  /** Force the icon to inherit `currentColor` instead of its brand color. */
  mono?: boolean
  className?: string
}

export function CVIcon({ name, size = 12, mono = false, className }: CVIconProps) {
  const icon = resolveIcon(name)
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
      return (
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          focusable="false"
          className={`cv-icon ${className ?? ''}`}
          style={{ ...box, fill: mono ? 'currentColor' : icon.hex }}
        >
          <path d={icon.path} />
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

/** Grouped options for the icon pickers in the editors. */
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
    ],
  },
]

export const ALL_ICON_NAMES: string[] = ICON_GROUPS.flatMap((g) => g.names)
