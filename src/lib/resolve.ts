import type {
  Basics,
  CustomItem,
  CVVariant,
  EducationItem,
  ExperienceItem,
  MasterProfile,
  ProjectItem,
  SkillGroup,
} from '../schema'
import {
  customIdFromKey,
  isCustomSectionKey,
  reconcileSectionOrder,
  sectionLabel,
} from './sections'

export type ResolvedSection =
  | { key: string; kind: 'experience'; label: string; items: ExperienceItem[] }
  | { key: string; kind: 'education'; label: string; items: EducationItem[] }
  | { key: string; kind: 'skills'; label: string; items: SkillGroup[] }
  | { key: string; kind: 'projects'; label: string; items: ProjectItem[] }
  | { key: string; kind: 'custom'; label: string; items: CustomItem[] }

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
 * included items, apply per-item overrides, and order/hide sections. Empty
 * sections are dropped so the rendered document never shows a bare heading.
 */
export function resolveVariant(
  profile: MasterProfile,
  variant: CVVariant,
): ResolvedCV {
  const basics: Basics = {
    ...profile.basics,
    headline: variant.basicsOverride.headline ?? profile.basics.headline,
    summary: variant.basicsOverride.summary ?? profile.basics.summary,
  }

  const order = reconcileSectionOrder(variant.sectionOrder, profile)
  const hidden = new Set(variant.hiddenSections)

  const sections: ResolvedSection[] = []
  for (const key of order) {
    if (hidden.has(key)) continue
    const label = sectionLabel(key, profile)

    if (key === 'experience') {
      const items = profile.experience
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))
      if (items.length) sections.push({ key, kind: 'experience', label, items })
    } else if (key === 'education') {
      const items = profile.education
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))
      if (items.length) sections.push({ key, kind: 'education', label, items })
    } else if (key === 'skills') {
      const items = profile.skills
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))
      if (items.length) sections.push({ key, kind: 'skills', label, items })
    } else if (key === 'projects') {
      const items = profile.projects
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))
      if (items.length) sections.push({ key, kind: 'projects', label, items })
    } else if (isCustomSectionKey(key)) {
      const sec = profile.custom.find((s) => s.id === customIdFromKey(key))
      if (!sec) continue
      const items = sec.items
        .filter((i) => isIncluded(variant, i.id))
        .map((i) => applyOverride(variant, i))
      if (items.length) sections.push({ key, kind: 'custom', label, items })
    }
  }

  return { basics, sections }
}
