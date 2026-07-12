import type { MasterProfile, SectionPlacement } from '../schema'

/**
 * Section keys identify orderable/hideable/placeable sections in a variant.
 * Standard sections use fixed keys; user-defined custom sections use `custom:<id>`.
 */
export const STANDARD_SECTIONS = [
  'experience',
  'education',
  'skills',
  'projects',
  'totals',
] as const

export type StandardSectionKey = (typeof STANDARD_SECTIONS)[number]

export const STANDARD_SECTION_LABELS: Record<StandardSectionKey, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  totals: 'Totals',
}

/**
 * Where each section lands when a variant has not said otherwise. Mirrors the
 * reference layout: experience runs down the main column, the supporting
 * sections stack in the sidebar, and the totals grid spans the full width.
 */
const DEFAULT_PLACEMENTS: Record<string, SectionPlacement> = {
  experience: { column: 'main', pageBreakBefore: false },
  education: { column: 'side', pageBreakBefore: false },
  skills: { column: 'side', pageBreakBefore: false },
  projects: { column: 'side', pageBreakBefore: false },
  totals: { column: 'full', pageBreakBefore: false },
}

export function defaultPlacement(key: string): SectionPlacement {
  return DEFAULT_PLACEMENTS[key] ?? { column: 'main', pageBreakBefore: false }
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
