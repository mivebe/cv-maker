import {
  appDataSchema,
  APP_DATA_VERSION,
  themePresetSchema,
  type AppData,
} from '../../schema'
import { themeFromPreset } from '../../cv/themes'
import { emptyProfile, ITEM_FACTORIES, newLink } from '../factory'
import { newId } from '../id'
import type { SectionKind } from '../../schema'

/**
 * The document as the assistant sees it, and the way back in.
 *
 * Out: data URLs (photo, logo, image icons) are swapped for short placeholders.
 * They are the bulk of a real document's bytes and a model can do nothing
 * useful with base64, so sending them would only burn the free tier's token
 * budget. In: placeholders are swapped back, so a photo survives any edit that
 * leaves its placeholder alone - and moves with it if the model moves it.
 */

const IMAGE_TOKEN = /^<image:(\d+)>$/

export interface Masked {
  doc: AppData
  images: string[]
}

export function maskImages(data: AppData): Masked {
  const images: string[] = []
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string' && v.startsWith('data:')) {
      images.push(v)
      return `<image:${images.length}>`
    }
    if (Array.isArray(v)) return v.map(walk)
    if (typeof v === 'object' && v !== null)
      return Object.fromEntries(
        Object.entries(v).map(([k, val]) => [k, walk(val)]),
      )
    return v
  }
  return { doc: walk(data) as AppData, images }
}

export function unmaskImages(value: unknown, images: string[]): unknown {
  if (typeof value === 'string') {
    const m = IMAGE_TOKEN.exec(value)
    // An invented token (`<image:9>` with no image 9) becomes empty, not text.
    return m ? (images[Number(m[1]) - 1] ?? '') : value
  }
  if (Array.isArray(value)) return value.map((v) => unmaskImages(v, images))
  if (typeof value === 'object' && value !== null)
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, unmaskImages(v, images)]),
    )
  return value
}

type Loose = Record<string, unknown>

const isObj = (v: unknown): v is Loose =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Fill what a model tends to leave out, before strict validation. New items
 * written from scratch routinely skip "boring" required fields (`current`,
 * `highlights`, `location`), and bouncing each of those back as an error would
 * spend a whole request per omission. Factories supply the blanks; anything
 * the model did write wins. Wrong *types* are left alone for zod to report.
 */
export function fillDefaults(value: unknown): unknown {
  if (!isObj(value)) return value
  const doc: Loose = { version: APP_DATA_VERSION, variants: [], ...value }
  const empty = emptyProfile()

  if (isObj(doc.profile)) {
    const profile: Loose = { ...empty, ...doc.profile }
    if (isObj(profile.basics)) {
      const basics: Loose = { ...empty.basics, ...profile.basics }
      if (Array.isArray(basics.links))
        basics.links = basics.links.map((l) =>
          isObj(l) ? { ...newLink(), ...l } : l,
        )
      profile.basics = basics
    }
    if (Array.isArray(profile.sections))
      profile.sections = profile.sections.map((s) => {
        if (!isObj(s)) return s
        const make = ITEM_FACTORIES[s.kind as SectionKind]
        const section: Loose = { id: newId('sec'), items: [], ...s }
        if (make && Array.isArray(section.items))
          section.items = section.items.map((it) =>
            isObj(it) ? { ...(make() ?? {}), ...it } : it,
          )
        return section
      })
    doc.profile = profile
  }

  if (Array.isArray(doc.variants))
    doc.variants = doc.variants.map((v) => {
      if (!isObj(v)) return v
      const theme = isObj(v.theme) ? v.theme : {}
      // An unknown preset still gets a full base; zod then reports the bad name.
      const preset = themePresetSchema.safeParse(theme.preset)
      const base = themeFromPreset(preset.success ? preset.data : 'showcase')
      return {
        id: newId('var'),
        name: 'Variant',
        targetRole: '',
        include: {},
        sectionOrder: [],
        hiddenSections: [],
        overrides: {},
        basicsOverride: {},
        ...v,
        theme: { ...base, ...theme },
      }
    })
  return doc
}

/** Ids are the wiring between master and variants, so a clash is fatal. */
function duplicateIds(data: AppData): string[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  const note = (id: string) => (seen.has(id) ? dupes.add(id) : seen.add(id))
  data.profile.basics.links.forEach((l) => note(l.id))
  for (const s of data.profile.sections) {
    note(s.id)
    for (const it of s.items as { id: string }[]) note(it.id)
  }
  data.variants.forEach((v) => note(v.id))
  return [...dupes]
}

export type Checked =
  { ok: true; data: AppData } | { ok: false; errors: string[] }

/** Strict validation, with every problem listed - the model fixes them all at once. */
export function checkDocument(value: unknown): Checked {
  const parsed = appDataSchema.safeParse(value)
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 12).map((issue) => {
      const path = '/' + issue.path.join('/')
      return `${path}: ${issue.message}`
    })
    return { ok: false, errors }
  }
  const dupes = duplicateIds(parsed.data)
  if (dupes.length)
    return {
      ok: false,
      errors: dupes.map((id) => `id "${id}" is used more than once`),
    }
  return { ok: true, data: parsed.data }
}
