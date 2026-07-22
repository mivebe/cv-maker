import type { CVVariant, Section } from '../../schema'

/**
 * What counts as "tailored": content this variant changes away from the master
 * profile - item overrides, dropped items, heading overrides, hidden sections,
 * per-section style overrides and basics overrides. Order and column placement
 * are arrangement, not tailoring, so they deliberately don't count.
 */

/** An item counts as tailored when it is overridden or dropped in this variant. */
export function isItemTailored(variant: CVVariant, itemId: string): boolean {
  const ov = variant.overrides[itemId]
  if (ov && Object.keys(ov).length > 0) return true
  return variant.include[itemId] === false
}

export type SectionTailoring = {
  titleOverridden: boolean
  hidden: boolean
  /** Per-section style overrides (variant.sectionOptions). */
  styleCount: number
  /** Items with field overrides or dropped from this variant. */
  tailoredItems: number
  count: number
}

export function sectionTailoring(
  variant: CVVariant,
  section: Section,
): SectionTailoring {
  const titleOverridden = Boolean(variant.sectionTitles[section.id]?.trim())
  const hidden = variant.hiddenSections.includes(section.id)
  const styleCount = Object.keys(
    variant.sectionOptions[section.id] ?? {},
  ).length
  const tailoredItems = (section.items as { id: string }[]).filter((it) =>
    isItemTailored(variant, it.id),
  ).length
  return {
    titleOverridden,
    hidden,
    styleCount,
    tailoredItems,
    count:
      (titleOverridden ? 1 : 0) + (hidden ? 1 : 0) + styleCount + tailoredItems,
  }
}

/** Basics fields (headline/summary/location) this variant overrides. */
export function tailoredBasicsFields(variant: CVVariant): string[] {
  return Object.entries(variant.basicsOverride)
    .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    .map(([k]) => k)
}
