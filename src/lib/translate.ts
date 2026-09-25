import type {
  CVVariant,
  MasterProfile,
  Section,
  SectionItem,
  SectionKind,
} from '../schema'
import { reconcileSectionOrder, sectionLabel } from './sections'

/**
 * A translated variant is an ordinary variant whose text overrides happen to
 * be in another language. This module is the one place that knows which text
 * is translatable and where each piece lives on a variant, so the AI action
 * and the side-by-side editor read and write it identically.
 *
 * Every piece of text has a key:
 *
 *   basics:<field>          name, headline, summary, location
 *   link:<linkId>           a header link's label
 *   section:<id>:title      a section heading
 *   section:<id>:subtitle   the line under it
 *   item:<itemId>:<field>   any text field of an item
 *
 * Writing a translation also records the master text it was made from
 * (`variant.translationSource[key]`). When the master later changes, the two
 * no longer match and the translation is flagged as outdated.
 */

export type TValue = string | string[]

/** Text fields per section kind, in the order the editor lists them. */
const ITEM_FIELDS: Record<SectionKind, string[]> = {
  experience: [
    'role',
    'organization',
    'location',
    'summary',
    'highlights',
    'tagsLabel',
    'tags',
  ],
  education: ['degree', 'institution', 'location', 'details'],
  skills: ['name', 'skills'],
  projects: ['name', 'description', 'highlights', 'badge', 'meta'],
  totals: ['label'],
  items: [
    'title',
    'subtitle',
    'description',
    'highlights',
    'meta',
    'tagsLabel',
    'tags',
  ],
  banner: [],
  chart: ['title'],
  sliders: ['title', 'subtitle'],
  titleList: ['title', 'subtitle'],
  languages: ['name'],
}

const BASICS_FIELDS = ['name', 'headline', 'summary', 'location'] as const
type BasicsField = (typeof BASICS_FIELDS)[number]

const FIELD_LABELS: Record<string, string> = {
  tagsLabel: 'Tag legend',
  meta: 'Note',
}

function fieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field]
  const spaced = field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** What a person would call an item: its role, degree, name or title. */
function itemName(item: SectionItem): string {
  const it = item as Record<string, unknown>
  for (const f of ['role', 'degree', 'name', 'title', 'label']) {
    const v = it[f]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return 'Item'
}

function isEmpty(v: TValue | undefined): boolean {
  if (v === undefined) return true
  return Array.isArray(v) ? v.every((s) => !s.trim()) : !v.trim()
}

function asTValue(v: unknown): TValue | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.every((s) => typeof s === 'string'))
    return v as string[]
  return undefined
}

const encode = (v: TValue) => JSON.stringify(v)

// ---- locating text ------------------------------------------------------

type Parsed =
  | { kind: 'basics'; field: BasicsField }
  | { kind: 'link'; id: string }
  | { kind: 'section'; id: string; field: 'title' | 'subtitle' }
  | { kind: 'item'; id: string; field: string }

function parseKey(key: string): Parsed | undefined {
  const [kind, a, b] = key.split(':')
  if (kind === 'basics' && (BASICS_FIELDS as readonly string[]).includes(a))
    return { kind, field: a as BasicsField }
  if (kind === 'link' && a) return { kind, id: a }
  if (kind === 'section' && a && (b === 'title' || b === 'subtitle'))
    return { kind, id: a, field: b }
  if (kind === 'item' && a && b) return { kind, id: a, field: b }
  return undefined
}

function findItem(profile: MasterProfile, id: string) {
  for (const section of profile.sections) {
    const item = (section.items as SectionItem[]).find((i) => i.id === id)
    if (item) return { section, item }
  }
  return undefined
}

/** The master's text for a key, or undefined when it no longer exists. */
export function masterValue(
  profile: MasterProfile,
  key: string,
): TValue | undefined {
  const k = parseKey(key)
  if (!k) return undefined
  switch (k.kind) {
    case 'basics':
      return profile.basics[k.field]
    case 'link':
      return profile.basics.links.find((l) => l.id === k.id)?.label
    case 'section': {
      const s = profile.sections.find((x) => x.id === k.id)
      if (!s) return undefined
      return k.field === 'title' ? sectionLabel(s) : s.subtitle
    }
    case 'item': {
      const found = findItem(profile, k.id)
      return found
        ? asTValue((found.item as Record<string, unknown>)[k.field])
        : undefined
    }
  }
}

/** What the variant prints for a key: its override, else the master. */
export function variantValue(
  profile: MasterProfile,
  variant: CVVariant,
  key: string,
): TValue | undefined {
  const k = parseKey(key)
  if (!k) return undefined
  switch (k.kind) {
    case 'basics':
      return variant.basicsOverride[k.field] ?? masterValue(profile, key)
    case 'link':
      return (
        asTValue(variant.overrides[k.id]?.label) ?? masterValue(profile, key)
      )
    case 'section': {
      const own =
        k.field === 'title'
          ? variant.sectionTitles[k.id]?.trim() || undefined
          : variant.sectionSubtitles?.[k.id]
      return own ?? masterValue(profile, key)
    }
    case 'item':
      return (
        asTValue(variant.overrides[k.id]?.[k.field]) ??
        masterValue(profile, key)
      )
  }
}

/** Store `value` as the variant's text for `key` (no source bookkeeping). */
function writeValue(v: CVVariant, key: string, value: TValue): CVVariant {
  const k = parseKey(key)
  if (!k) return v
  switch (k.kind) {
    case 'basics':
      return typeof value === 'string'
        ? { ...v, basicsOverride: { ...v.basicsOverride, [k.field]: value } }
        : v
    case 'link':
      return typeof value === 'string'
        ? {
            ...v,
            overrides: {
              ...v.overrides,
              [k.id]: { ...v.overrides[k.id], label: value },
            },
          }
        : v
    case 'section':
      if (typeof value !== 'string') return v
      return k.field === 'title'
        ? { ...v, sectionTitles: { ...v.sectionTitles, [k.id]: value } }
        : {
            ...v,
            sectionSubtitles: { ...v.sectionSubtitles, [k.id]: value },
          }
    case 'item':
      return {
        ...v,
        overrides: {
          ...v.overrides,
          [k.id]: { ...v.overrides[k.id], [k.field]: value },
        },
      }
  }
}

/** Drop the variant's text for `key` so the master shows through again. */
function removeValue(v: CVVariant, key: string): CVVariant {
  const k = parseKey(key)
  if (!k) return v
  switch (k.kind) {
    case 'basics': {
      const basicsOverride = { ...v.basicsOverride }
      delete basicsOverride[k.field]
      return { ...v, basicsOverride }
    }
    case 'section': {
      if (k.field === 'title') {
        const sectionTitles = { ...v.sectionTitles }
        delete sectionTitles[k.id]
        return { ...v, sectionTitles }
      }
      const sectionSubtitles = { ...v.sectionSubtitles }
      delete sectionSubtitles[k.id]
      return { ...v, sectionSubtitles }
    }
    case 'link':
    case 'item': {
      const field = k.kind === 'link' ? 'label' : k.field
      const forItem = { ...v.overrides[k.id] }
      delete forItem[field]
      const overrides = { ...v.overrides }
      if (Object.keys(forItem).length === 0) delete overrides[k.id]
      else overrides[k.id] = forItem
      return { ...v, overrides }
    }
  }
}

// ---- public API -------------------------------------------------------------

/**
 * Write translations, remembering the master text each one was made from.
 * Keys whose master text no longer exists are skipped.
 */
export function withTranslations(
  profile: MasterProfile,
  variant: CVVariant,
  values: Record<string, TValue>,
): CVVariant {
  let next = variant
  const translationSource = { ...variant.translationSource }
  for (const [key, value] of Object.entries(values)) {
    const master = masterValue(profile, key)
    if (master === undefined) continue
    next = writeValue(next, key, value)
    translationSource[key] = encode(master)
  }
  return { ...next, translationSource }
}

/** Forget one translation: the master text prints again. */
export function withoutTranslation(variant: CVVariant, key: string): CVVariant {
  const next = removeValue(variant, key)
  const translationSource = { ...variant.translationSource }
  delete translationSource[key]
  return { ...next, translationSource }
}

/** Keys whose master text changed since they were translated. */
export function outdatedKeys(
  profile: MasterProfile,
  variant: CVVariant,
): string[] {
  const out: string[] = []
  for (const [key, source] of Object.entries(variant.translationSource ?? {})) {
    const master = masterValue(profile, key)
    if (master !== undefined && encode(master) !== source) out.push(key)
  }
  return out
}

export interface TranslationEntry {
  key: string
  /** Where it sits: "Header", or the section's master heading. */
  group: string
  /** What it is: "Name", "Acme Corp · Highlights". */
  label: string
  /** The master text. */
  master: TValue
  /** What the variant prints today. */
  current: TValue
  translated: boolean
  outdated: boolean
}

/**
 * Every piece of text the variant prints, in page order: header first, then
 * each visible section's heading and its included items. Empty master text is
 * skipped, since there is nothing to translate.
 */
export function translationEntries(
  profile: MasterProfile,
  variant: CVVariant,
): TranslationEntry[] {
  const sources = variant.translationSource ?? {}
  const entries: TranslationEntry[] = []
  const push = (key: string, group: string, label: string) => {
    const master = masterValue(profile, key)
    if (master === undefined || isEmpty(master)) return
    entries.push({
      key,
      group,
      label,
      master,
      current: variantValue(profile, variant, key) ?? master,
      translated: key in sources,
      outdated: key in sources && sources[key] !== encode(master),
    })
  }

  for (const f of BASICS_FIELDS) push(`basics:${f}`, 'Header', fieldLabel(f))
  for (const link of profile.basics.links)
    push(`link:${link.id}`, 'Header', `Link · ${link.label || link.url}`)

  const hidden = new Set(variant.hiddenSections)
  const byId = new Map(profile.sections.map((s) => [s.id, s]))
  for (const id of reconcileSectionOrder(variant.sectionOrder, profile)) {
    const section: Section | undefined = byId.get(id)
    if (!section || hidden.has(id)) continue
    const group = sectionLabel(section)
    push(`section:${id}:title`, group, 'Heading')
    push(`section:${id}:subtitle`, group, 'Subtitle')
    for (const item of section.items as SectionItem[]) {
      if (variant.include[item.id] === false) continue
      const name = itemName(item)
      for (const field of ITEM_FIELDS[section.kind])
        push(
          `item:${item.id}:${field}`,
          group,
          `${name} · ${fieldLabel(field)}`,
        )
    }
  }
  return entries
}
