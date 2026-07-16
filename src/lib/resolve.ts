import type {
  Basics,
  CustomItem,
  CVVariant,
  EducationItem,
  ExperienceItem,
  MasterProfile,
  ProjectItem,
  SkillGroup,
  TotalItem,
} from '../schema'
import {
  customIdFromKey,
  defaultPlacement,
  isCustomSectionKey,
  reconcileSectionOrder,
  sectionLabel,
} from './sections'

/** Placement + presentation facts every resolved section carries. */
interface SectionBase {
  key: string
  label: string
  /** Sub-line under the section title (custom sections only). */
  subtitle: string
  column: 'main' | 'side' | 'full'
  pageBreakBefore: boolean
}

export type ResolvedSection = SectionBase &
  (
    | { kind: 'experience'; items: ExperienceItem[] }
    | { kind: 'education'; items: EducationItem[] }
    | { kind: 'skills'; items: SkillGroup[] }
    | { kind: 'projects'; items: ProjectItem[] }
    | { kind: 'custom'; items: CustomItem[] }
    | { kind: 'totals'; items: TotalItem[] }
    /** A title/subtitle block with no items (e.g. a page-2 banner heading). */
    | { kind: 'banner'; items: never[] }
  )

export interface ResolvedCV {
  basics: Basics
  sections: ResolvedSection[]
}

/** An item is included unless the variant explicitly excluded it. */
function isIncluded(variant: CVVariant, id: string): boolean {
  return variant.include[id] !== false
}

/** Shallow-merge a variant's per-item override on top of a master item. */
function applyOverride<T extends { id: string }>(
  variant: CVVariant,
  item: T,
): T {
  const override = variant.overrides[item.id]
  return override ? ({ ...item, ...override } as T) : item
}

/**
 * Compute the effective CV for a variant: apply basics overrides, filter to
 * included items, apply per-item overrides, and order/place/hide sections. Empty
 * sections are dropped so the document never shows a bare heading - except
 * banners, which are *defined* as heading-only.
 */
export function resolveVariant(
  profile: MasterProfile,
  variant: CVVariant,
): ResolvedCV {
  const basics: Basics = {
    ...profile.basics,
    headline: variant.basicsOverride.headline ?? profile.basics.headline,
    summary: variant.basicsOverride.summary ?? profile.basics.summary,
    location: variant.basicsOverride.location ?? profile.basics.location,
  }

  const order = reconcileSectionOrder(variant.sectionOrder, profile)
  const hidden = new Set(variant.hiddenSections)

  const sections: ResolvedSection[] = []
  for (const key of order) {
    if (hidden.has(key)) continue

    const placement = variant.sectionLayout[key] ?? defaultPlacement(key)
    const base = {
      key,
      label: variant.sectionTitles[key]?.trim() || sectionLabel(key, profile),
      subtitle: '',
      column: placement.column,
      pageBreakBefore: placement.pageBreakBefore,
    }

    const pick = <T extends { id: string }>(list: T[]): T[] =>
      list
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))

    if (key === 'experience') {
      const items = pick(profile.experience)
      if (items.length) sections.push({ ...base, kind: 'experience', items })
    } else if (key === 'education') {
      const items = pick(profile.education)
      if (items.length) sections.push({ ...base, kind: 'education', items })
    } else if (key === 'skills') {
      const items = pick(profile.skills)
      if (items.length) sections.push({ ...base, kind: 'skills', items })
    } else if (key === 'projects') {
      const items = pick(profile.projects)
      if (items.length) sections.push({ ...base, kind: 'projects', items })
    } else if (key === 'totals') {
      const items = pick(profile.totals)
      if (items.length) sections.push({ ...base, kind: 'totals', items })
    } else if (isCustomSectionKey(key)) {
      const sec = profile.custom.find((s) => s.id === customIdFromKey(key))
      if (!sec) continue
      const withSubtitle = { ...base, subtitle: sec.subtitle }
      if (sec.display === 'banner') {
        sections.push({ ...withSubtitle, kind: 'banner', items: [] })
        continue
      }
      const items = pick(sec.items)
      if (items.length)
        sections.push({ ...withSubtitle, kind: 'custom', items })
    }
  }

  return { basics, sections }
}
