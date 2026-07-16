import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppData,
  Basics,
  Branding,
  CVVariant,
  Link,
  MasterProfile,
  Section,
  SectionKind,
  SectionOptions,
  SectionPlacement,
  ThemeConfig,
} from '../schema'
import {
  emptyProfile,
  ITEM_FACTORIES,
  newLink,
  newSection,
  newVariant,
} from '../lib/factory'
import { sampleData } from '../lib/sample'
import { defaultPlacement, reconcileSectionOrder } from '../lib/sections'

type Direction = 'up' | 'down'

/** Move the element with `id` one step up/down; returns a new array. */
function moveById<T extends { id: string }>(
  list: T[],
  id: string,
  dir: Direction,
): T[] {
  const i = list.findIndex((x) => x.id === id)
  if (i < 0) return list
  const j = dir === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= list.length) return list
  const next = list.slice()
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

interface AppState {
  profile: MasterProfile
  variants: CVVariant[]

  // ---- whole document ----
  replaceAll: (data: AppData) => void
  resetToSample: () => void
  clearAll: () => void

  // ---- basics ----
  updateBasics: (patch: Partial<Basics>) => void
  updateBranding: (patch: Partial<Branding>) => void
  addLink: () => void
  updateLink: (id: string, patch: Partial<Link>) => void
  removeLink: (id: string) => void
  moveLink: (id: string, dir: Direction) => void

  // ---- sections ----
  addSection: (kind: SectionKind) => string
  updateSection: (
    id: string,
    patch: Partial<Pick<Section, 'title' | 'subtitle'>>,
  ) => void
  updateSectionOptions: (id: string, patch: Partial<SectionOptions>) => void
  removeSection: (id: string) => void
  moveSection: (id: string, dir: Direction) => void

  // ---- items within a section ----
  addItem: (sectionId: string) => string | undefined
  updateItem: (
    sectionId: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => void
  removeItem: (sectionId: string, itemId: string) => void
  moveItem: (sectionId: string, itemId: string, dir: Direction) => void

  // ---- variants ----
  addVariant: (name?: string) => string
  duplicateVariant: (id: string) => string | undefined
  deleteVariant: (id: string) => void
  renameVariant: (id: string, name: string) => void
  updateVariantMeta: (
    id: string,
    patch: Partial<Pick<CVVariant, 'name' | 'targetRole'>>,
  ) => void
  setVariantInclude: (id: string, itemId: string, included: boolean) => void
  setVariantSectionOrder: (id: string, order: string[]) => void
  moveVariantSection: (id: string, sectionId: string, dir: Direction) => void
  toggleSectionHidden: (id: string, sectionId: string) => void
  setSectionPlacement: (
    id: string,
    sectionId: string,
    patch: Partial<SectionPlacement>,
  ) => void
  setSectionTitle: (id: string, sectionId: string, title: string) => void
  setVariantOptionDefaults: (
    id: string,
    patch: Partial<SectionOptions>,
  ) => void
  clearVariantOptionDefault: (id: string, key: keyof SectionOptions) => void
  /** Replace the whole policy - what a theme-preset switch does. */
  replaceVariantOptionDefaults: (
    id: string,
    value: Partial<SectionOptions>,
  ) => void
  setVariantSectionOptions: (
    id: string,
    sectionId: string,
    patch: Partial<SectionOptions>,
  ) => void
  clearVariantSectionOption: (
    id: string,
    sectionId: string,
    key: keyof SectionOptions,
  ) => void
  setOverride: (
    variantId: string,
    itemId: string,
    field: string,
    value: unknown,
  ) => void
  clearOverride: (variantId: string, itemId: string, field: string) => void
  updateVariantTheme: (id: string, patch: Partial<ThemeConfig>) => void
  updateVariantBasics: (
    id: string,
    patch: Partial<CVVariant['basicsOverride']>,
  ) => void
}

function patchProfile(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  fn: (p: MasterProfile) => MasterProfile,
) {
  set((s) => ({ profile: fn(s.profile) }))
}

/** Apply `fn` to one section; every other section is left as-is. */
function patchSection(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  id: string,
  fn: (sec: Section) => Section,
) {
  patchProfile(set, (p) => ({
    ...p,
    sections: p.sections.map((sec) => (sec.id === id ? fn(sec) : sec)),
  }))
}

function patchVariant(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  id: string,
  fn: (v: CVVariant) => CVVariant,
) {
  set((s) => ({
    variants: s.variants.map((v) => (v.id === id ? fn(v) : v)),
  }))
}

const seed = sampleData()

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: seed.profile,
      variants: seed.variants,

      replaceAll: (data) =>
        set({ profile: data.profile, variants: data.variants }),
      resetToSample: () => {
        const s = sampleData()
        set({ profile: s.profile, variants: s.variants })
      },
      clearAll: () => {
        // Drop all content and variants, keeping an empty master profile.
        set({ profile: emptyProfile(), variants: [] })
      },

      // ---- basics ----
      updateBasics: (patch) =>
        patchProfile(set, (p) => ({ ...p, basics: { ...p.basics, ...patch } })),
      updateBranding: (patch) =>
        patchProfile(set, (p) => ({
          ...p,
          branding: { ...p.branding, ...patch },
        })),
      addLink: () =>
        patchProfile(set, (p) => ({
          ...p,
          basics: { ...p.basics, links: [...p.basics.links, newLink()] },
        })),
      updateLink: (id, patch) =>
        patchProfile(set, (p) => ({
          ...p,
          basics: {
            ...p.basics,
            links: p.basics.links.map((l) =>
              l.id === id ? { ...l, ...patch } : l,
            ),
          },
        })),
      removeLink: (id) =>
        patchProfile(set, (p) => ({
          ...p,
          basics: {
            ...p.basics,
            links: p.basics.links.filter((l) => l.id !== id),
          },
        })),
      moveLink: (id, dir) =>
        patchProfile(set, (p) => ({
          ...p,
          basics: { ...p.basics, links: moveById(p.basics.links, id, dir) },
        })),

      // ---- sections ----
      addSection: (kind) => {
        const sec = newSection(kind)
        patchProfile(set, (p) => ({ ...p, sections: [...p.sections, sec] }))
        return sec.id
      },
      updateSection: (id, patch) =>
        patchSection(set, id, (sec) => ({ ...sec, ...patch })),
      updateSectionOptions: (id, patch) =>
        patchSection(set, id, (sec) => ({
          ...sec,
          options: { ...sec.options, ...patch },
        })),
      removeSection: (id) =>
        patchProfile(set, (p) => ({
          ...p,
          sections: p.sections.filter((sec) => sec.id !== id),
        })),
      moveSection: (id, dir) =>
        patchProfile(set, (p) => ({
          ...p,
          sections: moveById(p.sections, id, dir),
        })),

      // ---- items ----
      addItem: (sectionId) => {
        const section = get().profile.sections.find((s) => s.id === sectionId)
        if (!section) return undefined
        const item = ITEM_FACTORIES[section.kind]()
        if (!item) return undefined
        patchSection(set, sectionId, (sec) => ({
          ...sec,
          items: [...sec.items, item],
        }) as Section)
        return item.id
      },
      updateItem: (sectionId, itemId, patch) =>
        patchSection(set, sectionId, (sec) => ({
          ...sec,
          items: (sec.items as { id: string }[]).map((it) =>
            it.id === itemId ? { ...it, ...patch } : it,
          ),
        }) as Section),
      removeItem: (sectionId, itemId) =>
        patchSection(set, sectionId, (sec) => ({
          ...sec,
          items: (sec.items as { id: string }[]).filter(
            (it) => it.id !== itemId,
          ),
        }) as Section),
      moveItem: (sectionId, itemId, dir) =>
        patchSection(set, sectionId, (sec) => ({
          ...sec,
          items: moveById(sec.items as { id: string }[], itemId, dir),
        }) as Section),

      // ---- variants ----
      addVariant: (name) => {
        const v = newVariant(get().profile, name)
        set((s) => ({ variants: [...s.variants, v] }))
        return v.id
      },
      duplicateVariant: (id) => {
        const src = get().variants.find((v) => v.id === id)
        if (!src) return undefined
        const copy: CVVariant = {
          ...structuredClone(src),
          id: newVariant(get().profile).id,
          name: `${src.name} (copy)`,
        }
        set((s) => ({ variants: [...s.variants, copy] }))
        return copy.id
      },
      deleteVariant: (id) =>
        set((s) => ({ variants: s.variants.filter((v) => v.id !== id) })),
      renameVariant: (id, name) =>
        patchVariant(set, id, (v) => ({ ...v, name })),
      updateVariantMeta: (id, patch) =>
        patchVariant(set, id, (v) => ({ ...v, ...patch })),
      setVariantInclude: (id, itemId, included) =>
        patchVariant(set, id, (v) => ({
          ...v,
          include: { ...v.include, [itemId]: included },
        })),
      setVariantSectionOrder: (id, order) =>
        patchVariant(set, id, (v) => ({ ...v, sectionOrder: order })),
      moveVariantSection: (id, sectionId, dir) =>
        patchVariant(set, id, (v) => {
          const order = reconcileSectionOrder(v.sectionOrder, get().profile)
          const asItems = order.map((k) => ({ id: k }))
          return {
            ...v,
            sectionOrder: moveById(asItems, sectionId, dir).map((x) => x.id),
          }
        }),
      toggleSectionHidden: (id, sectionId) =>
        patchVariant(set, id, (v) => ({
          ...v,
          hiddenSections: v.hiddenSections.includes(sectionId)
            ? v.hiddenSections.filter((k) => k !== sectionId)
            : [...v.hiddenSections, sectionId],
        })),
      setSectionPlacement: (id, sectionId, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          sectionLayout: {
            ...v.sectionLayout,
            [sectionId]: {
              ...(v.sectionLayout[sectionId] ??
                defaultPlacement(get().profile, sectionId)),
              ...patch,
            },
          },
        })),
      setSectionTitle: (id, sectionId, title) =>
        patchVariant(set, id, (v) => {
          const sectionTitles = { ...v.sectionTitles }
          // An empty rename means "use the default label", not "no heading".
          if (title.trim()) sectionTitles[sectionId] = title
          else delete sectionTitles[sectionId]
          return { ...v, sectionTitles }
        }),
      setVariantOptionDefaults: (id, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          optionDefaults: { ...v.optionDefaults, ...patch },
        })),
      clearVariantOptionDefault: (id, key) =>
        patchVariant(set, id, (v) => {
          const optionDefaults = { ...v.optionDefaults }
          delete optionDefaults[key]
          return { ...v, optionDefaults }
        }),
      replaceVariantOptionDefaults: (id, value) =>
        patchVariant(set, id, (v) => ({ ...v, optionDefaults: { ...value } })),
      setVariantSectionOptions: (id, sectionId, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          sectionOptions: {
            ...v.sectionOptions,
            [sectionId]: { ...v.sectionOptions[sectionId], ...patch },
          },
        })),
      clearVariantSectionOption: (id, sectionId, key) =>
        patchVariant(set, id, (v) => {
          const forSection = { ...v.sectionOptions[sectionId] }
          delete forSection[key]
          const sectionOptions = { ...v.sectionOptions }
          if (Object.keys(forSection).length === 0)
            delete sectionOptions[sectionId]
          else sectionOptions[sectionId] = forSection
          return { ...v, sectionOptions }
        }),
      setOverride: (variantId, itemId, field, value) =>
        patchVariant(set, variantId, (v) => ({
          ...v,
          overrides: {
            ...v.overrides,
            [itemId]: { ...v.overrides[itemId], [field]: value },
          },
        })),
      clearOverride: (variantId, itemId, field) =>
        patchVariant(set, variantId, (v) => {
          const forItem = { ...v.overrides[itemId] }
          delete forItem[field]
          const overrides = { ...v.overrides }
          if (Object.keys(forItem).length === 0) delete overrides[itemId]
          else overrides[itemId] = forItem
          return { ...v, overrides }
        }),
      updateVariantTheme: (id, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          theme: { ...v.theme, ...patch },
        })),
      updateVariantBasics: (id, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          basicsOverride: { ...v.basicsOverride, ...patch },
        })),
    }),
    {
      /**
       * v2 is the one-sections-array shape. There is deliberately no migration
       * from `cv-maker:v1` (the fixed-shape profile): the old blob stays in
       * localStorage but is never read again. Real data should have been
       * exported to JSON before this shipped.
       */
      name: 'cv-maker:v2',
      version: 1,
      partialize: (s) => ({ profile: s.profile, variants: s.variants }),
    },
  ),
)
