import type {
  Basics,
  Branding,
  ChartItem,
  CustomItem,
  CVVariant,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  MasterProfile,
  ProjectItem,
  SectionOptions,
  SkillGroup,
  SliderItem,
  TitleItem,
  TotalItem,
} from '../schema'
import {
  KIND_OPTION_DEFAULTS,
  KIND_PLACEMENT,
  reconcileSectionOrder,
  sectionLabel,
} from './sections'

/** Placement + presentation facts every resolved section carries. */
interface SectionBase {
  id: string
  label: string
  /** Sub-line under the section title. */
  subtitle: string
  column: 'main' | 'side' | 'full'
  pageBreakBefore: boolean
  /** The fully merged display options (kind baseline -> section -> variant). */
  options: SectionOptions
}

export type ResolvedSection = SectionBase &
  (
    | { kind: 'experience'; items: ExperienceItem[] }
    | { kind: 'education'; items: EducationItem[] }
    | { kind: 'skills'; items: SkillGroup[] }
    | { kind: 'projects'; items: ProjectItem[] }
    | { kind: 'totals'; items: TotalItem[] }
    | { kind: 'items'; items: CustomItem[] }
    /** A title/subtitle block with no items (e.g. a page-2 banner heading). */
    | { kind: 'banner'; items: never[] }
    | { kind: 'chart'; items: ChartItem[] }
    | { kind: 'sliders'; items: SliderItem[] }
    | { kind: 'titleList'; items: TitleItem[] }
    | { kind: 'languages'; items: LanguageItem[] }
  )

export interface ResolvedCV {
  basics: Basics
  sections: ResolvedSection[]
  /** The issuing organisation, or null when the profile has no branding on. */
  branding: Branding | null
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
 * included items, apply per-item overrides, and order/place/hide sections.
 * Empty sections are dropped so the document never shows a bare heading -
 * except banners, which are *defined* as heading-only.
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
  const byId = new Map(profile.sections.map((s) => [s.id, s]))

  const sections: ResolvedSection[] = []
  for (const id of order) {
    if (hidden.has(id)) continue
    const section = byId.get(id)
    if (!section) continue

    const placement =
      variant.sectionLayout[id] ?? KIND_PLACEMENT[section.kind]

    // Four layers, most specific last. `variant.optionDefaults` outranks
    // `section.options` ON PURPOSE: it is a policy ("this variant has no icons
    // anywhere"), and a policy any section could dodge by simply having a value
    // set would be no policy at all. The per-section escape hatch is
    // `variant.sectionOptions[id]`, which must be stated explicitly.
    const options: SectionOptions = {
      ...KIND_OPTION_DEFAULTS[section.kind],
      ...section.options,
      ...variant.optionDefaults,
      ...variant.sectionOptions[id],
    }

    const base: SectionBase = {
      id,
      label: variant.sectionTitles[id]?.trim() || sectionLabel(section),
      subtitle: section.subtitle,
      column: placement.column,
      pageBreakBefore: placement.pageBreakBefore,
      options,
    }

    if (section.kind === 'banner') {
      sections.push({ ...base, kind: 'banner', items: [] })
      continue
    }

    const items = (section.items as { id: string }[])
      .filter((i) => isIncluded(variant, i.id))
      .map((i) => applyOverride(variant, i))
    if (!items.length) continue

    // A chart whose slices are all zero would render as a bare heading: the
    // renderer has nothing to draw, so the section is as empty as no items.
    if (
      section.kind === 'chart' &&
      !(items as ChartItem[]).some((i) => i.value > 0)
    )
      continue

    sections.push({
      ...base,
      kind: section.kind,
      items,
    } as ResolvedSection)
  }

  return {
    basics,
    sections,
    branding: profile.branding.enabled ? profile.branding : null,
  }
}
