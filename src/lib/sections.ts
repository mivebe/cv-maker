import type { MasterProfile } from '../schema'

/**
 * Section keys identify orderable/hideable sections in a variant. Standard
 * sections use fixed keys; user-defined custom sections use `custom:<id>`.
 */
export const STANDARD_SECTIONS = [
  'experience',
  'education',
  'skills',
  'projects',
] as const

export type StandardSectionKey = (typeof STANDARD_SECTIONS)[number]

export const STANDARD_SECTION_LABELS: Record<StandardSectionKey, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
}

export function customSectionKey(id: string): string {
  return `custom:${id}`
}

export function isCustomSectionKey(key: string): boolean {
  return key.startsWith('custom:')
}

export function customIdFromKey(key: string): string {
  return key.slice('custom:'.length)
}

/** All section keys that exist given the current master profile. */
export function allSectionKeys(profile: MasterProfile): string[] {
  return [
    ...STANDARD_SECTIONS,
    ...profile.custom.map((s) => customSectionKey(s.id)),
  ]
}

/** Human label for any section key, resolving custom section titles. */
export function sectionLabel(key: string, profile: MasterProfile): string {
  if (isCustomSectionKey(key)) {
    const id = customIdFromKey(key)
    return profile.custom.find((s) => s.id === id)?.title ?? 'Custom Section'
  }
  return STANDARD_SECTION_LABELS[key as StandardSectionKey] ?? key
}

/**
 * Reconcile a variant's stored section order with the sections that actually
 * exist: keep known keys in their saved order, drop stale ones, and append any
 * new sections (e.g. a custom section added to the master after the variant was
 * created) so nothing silently disappears.
 */
export function reconcileSectionOrder(
  savedOrder: string[],
  profile: MasterProfile,
): string[] {
  const existing = new Set(allSectionKeys(profile))
  const kept = savedOrder.filter((k) => existing.has(k))
  const keptSet = new Set(kept)
  const appended = allSectionKeys(profile).filter((k) => !keptSet.has(k))
  return [...kept, ...appended]
}
