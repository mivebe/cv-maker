import type { AppData, SectionItem, SectionKind } from '../schema'
import { itemLabel, KIND_LABELS, sectionLabel } from '../lib/sections'

/**
 * Turns a store action into something a person can recognise in the history
 * panel. "Edited item" thirty times over is useless for finding the moment you
 * want back, so every action resolves its ids to the thing you actually
 * touched - the section's heading, the item's title, the variant's name.
 *
 * Labels are built at record time, while both the before and after documents
 * are in hand: a removal can only be named from the document that still
 * contained it.
 */

export type Doc = Pick<AppData, 'profile' | 'variants'>

export interface Described {
  /** Verb plus target: "Removed Experience - Acme Corp". */
  title: string
  /** What changed within it, if anything: "title, subtitle". */
  detail?: string
  /**
   * Ids this change is addressed to. Re-applying is only offered while all of
   * them still resolve - replaying an edit onto a deleted item does nothing.
   */
  refs: string[]
}

/** `pageBreakBefore` -> `page break before`. */
function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toLowerCase())
}

function fieldsOf(patch: unknown): string | undefined {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch))
    return undefined
  const keys = Object.keys(patch as Record<string, unknown>)
  return keys.length ? keys.map(humanize).join(', ') : undefined
}

function quote(name: string | undefined, fallback: string): string {
  const trimmed = name?.trim()
  return trimmed ? `"${trimmed}"` : fallback
}

function findSection(doc: Doc, id: string) {
  return doc.profile.sections.find((s) => s.id === id)
}

/** Sections carry the kind, so an item is only nameable with its section. */
function findItem(doc: Doc, itemId: string) {
  for (const section of doc.profile.sections) {
    const item = (section.items as SectionItem[]).find((i) => i.id === itemId)
    if (item) return { section, item }
  }
  return undefined
}

function findVariant(doc: Doc, id: string) {
  return doc.variants.find((v) => v.id === id)
}

/**
 * Name things as they ended up, so an entry matches what is on screen now -
 * falling back to the document that still had it, since a removal is gone from
 * `after` entirely.
 */
function pick<T>(
  before: Doc,
  after: Doc,
  get: (doc: Doc) => T | undefined,
): T | undefined {
  return get(after) ?? get(before)
}

function sectionName(before: Doc, after: Doc, id: string): string {
  const section = pick(before, after, (d) => findSection(d, id))
  return section ? sectionLabel(section) : 'a section'
}

function itemName(before: Doc, after: Doc, id: string): string {
  const found = pick(before, after, (d) => findItem(d, id))
  if (!found) return 'an item'
  const label = itemLabel(found.section.kind, found.item)
  const where = sectionLabel(found.section)
  return label.trim() ? `${where} · ${label}` : where
}

function variantName(before: Doc, after: Doc, id: string): string {
  const variant = pick(before, after, (d) => findVariant(d, id))
  return quote(variant?.name, 'a variant')
}

function linkName(before: Doc, after: Doc, id: string): string {
  const link = pick(before, after, (d) =>
    d.profile.basics.links.find((l) => l.id === id),
  )
  return quote(link?.label || link?.url, 'a link')
}

type Describe = (ctx: {
  args: unknown[]
  before: Doc
  after: Doc
}) => Described | string

/** Per action: which arguments are entity ids, and how to name the change. */
interface Rule {
  /** Argument positions holding an id that must still exist to re-apply. */
  ids?: number[]
  describe: Describe
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

const RULES: Record<string, Rule> = {
  // ---- whole document ----
  replaceAll: { describe: () => 'Imported a document' },
  applyAiEdit: {
    describe: ({ args }) => ({
      title: 'AI assistant edit',
      detail: str(args[1]).slice(0, 120) || undefined,
      refs: [],
    }),
  },
  resetToSample: { describe: () => 'Reset to the sample document' },
  clearAll: { describe: () => 'Cleared everything' },

  // ---- basics ----
  updateBasics: {
    describe: ({ args }) => ({
      title: 'Edited basics',
      detail: fieldsOf(args[0]),
      refs: [],
    }),
  },
  updateBranding: {
    describe: ({ args }) => ({
      title: 'Edited branding',
      detail: fieldsOf(args[0]),
      refs: [],
    }),
  },
  addLink: { describe: () => 'Added a link' },
  updateLink: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Edited link ${linkName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  removeLink: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Removed link ${linkName(before, after, str(args[0]))}`,
  },
  moveLink: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Moved link ${linkName(before, after, str(args[0]))} ${str(args[1])}`,
  },
  setLinkOrder: { describe: () => 'Reordered links' },

  // ---- sections ----
  addSection: {
    describe: ({ args }) => {
      const kind = KIND_LABELS[str(args[0]) as SectionKind]
      return kind ? `Added a ${kind} section` : 'Added a section'
    },
  },
  updateSection: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Edited section ${sectionName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  updateSectionOptions: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Options of ${sectionName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  removeSection: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Removed section ${sectionName(before, after, str(args[0]))}`,
  },
  moveSection: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Moved ${sectionName(before, after, str(args[0]))} ${str(args[1])}`,
  },

  // ---- items ----
  addItem: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Added an item to ${sectionName(before, after, str(args[0]))}`,
  },
  updateItem: {
    ids: [0, 1],
    describe: ({ args, before, after }) => ({
      title: `Edited ${itemName(before, after, str(args[1]))}`,
      detail: fieldsOf(args[2]),
      refs: [str(args[0]), str(args[1])],
    }),
  },
  removeItem: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Removed ${itemName(before, after, str(args[1]))}`,
  },
  moveItem: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Moved ${itemName(before, after, str(args[1]))} ${str(args[2])}`,
  },
  setItemOrder: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Reordered ${sectionName(before, after, str(args[0]))}`,
  },

  // ---- variants ----
  addVariant: { describe: () => 'Added a variant' },
  duplicateVariant: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Duplicated variant ${variantName(before, after, str(args[0]))}`,
  },
  deleteVariant: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Deleted variant ${variantName(before, after, str(args[0]))}`,
  },
  renameVariant: {
    ids: [0],
    describe: ({ args }) => `Renamed a variant to ${quote(str(args[1]), '""')}`,
  },
  updateVariantMeta: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Edited variant ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  setVariantInclude: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `${args[2] ? 'Included' : 'Excluded'} ${itemName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
  },
  setVariantSectionOrder: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Reordered sections in ${variantName(before, after, str(args[0]))}`,
  },
  moveVariantSection: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Moved ${sectionName(before, after, str(args[1]))} ${str(args[2])} in ${variantName(before, after, str(args[0]))}`,
  },
  toggleSectionHidden: {
    ids: [0, 1],
    describe: ({ args, before, after }) => {
      const hidden = findVariant(after, str(args[0]))?.hiddenSections.includes(
        str(args[1]),
      )
      return `${hidden ? 'Hid' : 'Showed'} ${sectionName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`
    },
  },
  setSectionPlacement: {
    ids: [0, 1],
    describe: ({ args, before, after }) => ({
      title: `Placed ${sectionName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[2]),
      refs: [str(args[0]), str(args[1])],
    }),
  },
  setSectionTitle: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Retitled ${sectionName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
  },
  setVariantOptionDefaults: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Design defaults of ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  clearVariantOptionDefault: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Cleared default ${humanize(str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
  },
  replaceVariantOptionDefaults: {
    ids: [0],
    describe: ({ args, before, after }) =>
      `Applied a design preset to ${variantName(before, after, str(args[0]))}`,
  },
  setVariantSectionOptions: {
    ids: [0, 1],
    describe: ({ args, before, after }) => ({
      title: `Options of ${sectionName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[2]),
      refs: [str(args[0]), str(args[1])],
    }),
  },
  clearVariantSectionOption: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Cleared ${humanize(str(args[2]))} on ${sectionName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
  },
  setOverride: {
    ids: [0, 1],
    describe: ({ args, before, after }) => ({
      title: `Tailored ${itemName(before, after, str(args[1]))} in ${variantName(before, after, str(args[0]))}`,
      detail: humanize(str(args[2])),
      refs: [str(args[0]), str(args[1])],
    }),
  },
  clearOverride: {
    ids: [0, 1],
    describe: ({ args, before, after }) =>
      `Cleared tailoring of ${humanize(str(args[2]))} on ${itemName(before, after, str(args[1]))}`,
  },
  updateVariantTheme: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Theme of ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
  updateVariantBasics: {
    ids: [0],
    describe: ({ args, before, after }) => ({
      title: `Header overrides of ${variantName(before, after, str(args[0]))}`,
      detail: fieldsOf(args[1]),
      refs: [str(args[0])],
    }),
  },
}

export function describeAction(
  name: string,
  args: unknown[],
  before: Doc,
  after: Doc,
): Described {
  const rule = RULES[name]
  if (!rule) return { title: humanize(name), refs: [] }
  const result = rule.describe({ args, before, after })
  const refs = (rule.ids ?? []).map((i) => str(args[i])).filter(Boolean)
  return typeof result === 'string' ? { title: result, refs } : result
}

/** True while every id the change is addressed to still exists. */
export function refsResolve(doc: Doc, refs: string[]): boolean {
  return refs.every(
    (id) =>
      findSection(doc, id) !== undefined ||
      findItem(doc, id) !== undefined ||
      findVariant(doc, id) !== undefined ||
      doc.profile.basics.links.some((l) => l.id === id),
  )
}
