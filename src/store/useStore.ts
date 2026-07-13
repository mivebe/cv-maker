import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppData,
  Basics,
  CustomItem,
  CustomSection,
  CVVariant,
  EducationItem,
  ExperienceItem,
  Link,
  MasterProfile,
  ProjectItem,
  SectionPlacement,
  SkillGroup,
  ThemeConfig,
  TotalItem,
} from '../schema'
import { masterProfileSchema, variantSchema } from '../schema'
import {
  emptyProfile,
  newCustomItem,
  newCustomSection,
  newEducation,
  newExperience,
  newLink,
  newProject,
  newSkillGroup,
  newTotal,
  newVariant,
} from '../lib/factory'
import { sampleData } from '../lib/sample'
import { defaultPlacement, reconcileSectionOrder } from '../lib/sections'

/** The standard profile array sections that share generic list ops. */
export type ListSection =
  'experience' | 'education' | 'skills' | 'projects' | 'totals'

type ItemOf = {
  experience: ExperienceItem
  education: EducationItem
  skills: SkillGroup
  projects: ProjectItem
  totals: TotalItem
}

const FACTORIES: { [K in ListSection]: () => ItemOf[K] } = {
  experience: newExperience,
  education: newEducation,
  skills: newSkillGroup,
  projects: newProject,
  totals: newTotal,
}

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
  addLink: () => void
  updateLink: (id: string, patch: Partial<Link>) => void
  removeLink: (id: string) => void
  moveLink: (id: string, dir: Direction) => void

  // ---- standard list sections ----
  addItem: (section: ListSection) => string
  updateItem: <K extends ListSection>(
    section: K,
    id: string,
    patch: Partial<ItemOf[K]>,
  ) => void
  removeItem: (section: ListSection, id: string) => void
  moveItem: (section: ListSection, id: string, dir: Direction) => void

  // ---- custom sections ----
  addCustomSection: () => string
  updateCustomSection: (id: string, patch: Partial<CustomSection>) => void
  removeCustomSection: (id: string) => void
  moveCustomSection: (id: string, dir: Direction) => void
  addCustomItem: (sectionId: string) => void
  updateCustomItem: (
    sectionId: string,
    itemId: string,
    patch: Partial<CustomItem>,
  ) => void
  removeCustomItem: (sectionId: string, itemId: string) => void
  moveCustomItem: (sectionId: string, itemId: string, dir: Direction) => void

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
  moveVariantSection: (id: string, sectionKey: string, dir: Direction) => void
  toggleSectionHidden: (id: string, sectionKey: string) => void
  setSectionPlacement: (
    id: string,
    sectionKey: string,
    patch: Partial<SectionPlacement>,
  ) => void
  setSectionTitle: (id: string, sectionKey: string, title: string) => void
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

function patchVariant(
  set: (fn: (s: AppState) => Partial<AppState>) => void,
  id: string,
  fn: (v: CVVariant) => CVVariant,
) {
  set((s) => ({
    variants: s.variants.map((v) => (v.id === id ? fn(v) : v)),
  }))
}

/** What `partialize` writes to localStorage, and what `migrate` must return. */
type PersistedState = Pick<AppState, 'profile' | 'variants'>

/** Parse a persisted variant array, or null if any entry is unrecoverable. */
function parseVariants(value: unknown): CVVariant[] | null {
  if (!Array.isArray(value)) return null
  const out: CVVariant[] = []
  for (const v of value) {
    const parsed = variantSchema.safeParse(v)
    if (!parsed.success) return null
    out.push(parsed.data)
  }
  return out
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

      // ---- standard list sections ----
      addItem: (section) => {
        const item = FACTORIES[section]()
        patchProfile(set, (p) => ({
          ...p,
          [section]: [...p[section], item],
        }))
        return item.id
      },
      updateItem: (section, id, patch) =>
        patchProfile(set, (p) => ({
          ...p,
          [section]: (p[section] as { id: string }[]).map((it) =>
            it.id === id ? { ...it, ...patch } : it,
          ),
        })),
      removeItem: (section, id) =>
        patchProfile(set, (p) => ({
          ...p,
          [section]: (p[section] as { id: string }[]).filter(
            (it) => it.id !== id,
          ),
        })),
      moveItem: (section, id, dir) =>
        patchProfile(set, (p) => ({
          ...p,
          [section]: moveById(p[section] as { id: string }[], id, dir),
        })),

      // ---- custom sections ----
      addCustomSection: () => {
        const sec = newCustomSection()
        patchProfile(set, (p) => ({ ...p, custom: [...p.custom, sec] }))
        return sec.id
      },
      updateCustomSection: (id, patch) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      removeCustomSection: (id) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.filter((s) => s.id !== id),
        })),
      moveCustomSection: (id, dir) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: moveById(p.custom, id, dir),
        })),
      addCustomItem: (sectionId) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.map((s) =>
            s.id === sectionId
              ? { ...s, items: [...s.items, newCustomItem()] }
              : s,
          ),
        })),
      updateCustomItem: (sectionId, itemId, patch) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  items: s.items.map((it) =>
                    it.id === itemId ? { ...it, ...patch } : it,
                  ),
                }
              : s,
          ),
        })),
      removeCustomItem: (sectionId, itemId) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.map((s) =>
            s.id === sectionId
              ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
              : s,
          ),
        })),
      moveCustomItem: (sectionId, itemId, dir) =>
        patchProfile(set, (p) => ({
          ...p,
          custom: p.custom.map((s) =>
            s.id === sectionId
              ? { ...s, items: moveById(s.items, itemId, dir) }
              : s,
          ),
        })),

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
      moveVariantSection: (id, sectionKey, dir) =>
        patchVariant(set, id, (v) => {
          const order = reconcileSectionOrder(v.sectionOrder, get().profile)
          const asItems = order.map((k) => ({ id: k }))
          return {
            ...v,
            sectionOrder: moveById(asItems, sectionKey, dir).map((x) => x.id),
          }
        }),
      toggleSectionHidden: (id, sectionKey) =>
        patchVariant(set, id, (v) => ({
          ...v,
          hiddenSections: v.hiddenSections.includes(sectionKey)
            ? v.hiddenSections.filter((k) => k !== sectionKey)
            : [...v.hiddenSections, sectionKey],
        })),
      setSectionPlacement: (id, sectionKey, patch) =>
        patchVariant(set, id, (v) => ({
          ...v,
          sectionLayout: {
            ...v.sectionLayout,
            [sectionKey]: {
              ...(v.sectionLayout[sectionKey] ?? defaultPlacement(sectionKey)),
              ...patch,
            },
          },
        })),
      setSectionTitle: (id, sectionKey, title) =>
        patchVariant(set, id, (v) => {
          const sectionTitles = { ...v.sectionTitles }
          // An empty rename means "use the default label", not "no heading".
          if (title.trim()) sectionTitles[sectionKey] = title
          else delete sectionTitles[sectionKey]
          return { ...v, sectionTitles }
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
      name: 'cv-maker:v1',
      version: 3,
      partialize: (s) => ({ profile: s.profile, variants: s.variants }),
      /**
       * Older state predates icons/avatar/chips/totals/placement/bullets. Every
       * field added since has a Zod default, so re-parsing the persisted state
       * through the schemas is the migration: it backfills the new fields and
       * leaves the user's content untouched. Without this, already-saved profiles
       * would hit the renderer with `undefined` where it expects a theme token.
       * Bump `version` whenever a token is added, so saved themes get the default.
       */
      migrate: (persisted, version): PersistedState => {
        const asIs = persisted as PersistedState
        if (version >= 3) return asIs

        const profile = masterProfileSchema.safeParse(asIs?.profile)
        const variants = parseVariants(asIs?.variants)
        if (!profile.success || !variants) {
          console.warn('cv-maker: could not migrate saved data; keeping as-is')
          return asIs
        }
        return { profile: profile.data, variants }
      },
    },
  ),
)
