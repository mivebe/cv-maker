import { sectionOptionsSchema } from '../schema'
import type {
  MasterProfile,
  Section,
  SectionKind,
  SectionOptions,
  SectionPlacement,
} from '../schema'

/**
 * The section-kind registry. A section is an instance (`profile.sections[i]`)
 * of a kind; everything keyed here is keyed by kind, and everything a variant
 * stores (order, hiding, placement, titles, options) is keyed by the
 * instance's `id`.
 */

export const SECTION_KINDS = [
  'experience',
  'education',
  'skills',
  'projects',
  'totals',
  'items',
  'banner',
  'chart',
  'sliders',
  'titleList',
  'languages',
] as const

// The registry and the schema union must agree; this fails to compile if a
// kind exists in one but not the other.
type RegistryKind = (typeof SECTION_KINDS)[number]
type _KindsMatch = [RegistryKind] extends [SectionKind]
  ? [SectionKind] extends [RegistryKind]
    ? true
    : never
  : never
const _kindsMatch: _KindsMatch = true
void _kindsMatch

export const KIND_LABELS: Record<SectionKind, string> = {
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  totals: 'Totals',
  items: 'Custom',
  banner: 'Banner',
  chart: 'Chart',
  sliders: 'Slider List',
  titleList: 'Title List',
  languages: 'Languages',
}

/** Where a newly added section lands. The user drags it after that. */
export const KIND_PLACEMENT: Record<SectionKind, SectionPlacement> = {
  experience: { column: 'main', pageBreakBefore: false },
  education: { column: 'side', pageBreakBefore: false },
  skills: { column: 'side', pageBreakBefore: false },
  projects: { column: 'side', pageBreakBefore: false },
  totals: { column: 'full', pageBreakBefore: false },
  items: { column: 'main', pageBreakBefore: false },
  banner: { column: 'full', pageBreakBefore: false },
  chart: { column: 'side', pageBreakBefore: false },
  sliders: { column: 'side', pageBreakBefore: false },
  titleList: { column: 'side', pageBreakBefore: false },
  languages: { column: 'side', pageBreakBefore: false },
}

/** The schema's own defaults, the floor under every kind baseline. */
const SCHEMA_OPTION_DEFAULTS: SectionOptions = sectionOptionsSchema.parse({})

/**
 * Each kind's baseline options - the first layer of the resolve merge, under
 * the section's own (sparse) options and the variant's two override layers.
 * Item-y kinds keep the divider the old theme.itemDivider defaulted on;
 * totals keeps its old totalsColumns/totalsDivider defaults.
 */
export const KIND_OPTION_DEFAULTS: Record<SectionKind, SectionOptions> = {
  experience: { ...SCHEMA_OPTION_DEFAULTS, rowDividers: true },
  education: { ...SCHEMA_OPTION_DEFAULTS, rowDividers: true },
  skills: { ...SCHEMA_OPTION_DEFAULTS },
  projects: { ...SCHEMA_OPTION_DEFAULTS, rowDividers: true },
  totals: { ...SCHEMA_OPTION_DEFAULTS, columns: 4, rowDividers: true },
  items: { ...SCHEMA_OPTION_DEFAULTS, rowDividers: true },
  banner: { ...SCHEMA_OPTION_DEFAULTS },
  chart: { ...SCHEMA_OPTION_DEFAULTS },
  sliders: { ...SCHEMA_OPTION_DEFAULTS },
  titleList: { ...SCHEMA_OPTION_DEFAULTS },
  languages: { ...SCHEMA_OPTION_DEFAULTS },
}

/** The four language stages, fixed: the words and the notch count cannot disagree. */
export const LANGUAGE_STAGES = [
  'Beginner',
  'Intermediate',
  'Professional',
  'Native',
] as const

/** A section's effective options outside any variant (the editor's view). */
export function effectiveOptions(section: Section): SectionOptions {
  return { ...KIND_OPTION_DEFAULTS[section.kind], ...section.options }
}

/** Heading text for a section: its own title, or the kind's default label. */
export function sectionLabel(section: Section): string {
  return section.title.trim() || KIND_LABELS[section.kind]
}

export function sectionById(
  profile: MasterProfile,
  id: string,
): Section | undefined {
  return profile.sections.find((s) => s.id === id)
}

export function defaultPlacement(
  profile: MasterProfile,
  id: string,
): SectionPlacement {
  const section = sectionById(profile, id)
  return section
    ? KIND_PLACEMENT[section.kind]
    : { column: 'main', pageBreakBefore: false }
}

/**
 * Reconcile a variant's stored section order with the sections that actually
 * exist: keep known ids in their saved order, drop stale ones, and append any
 * new sections (added to the master after the variant was created) so nothing
 * silently disappears.
 */
export function reconcileSectionOrder(
  savedOrder: string[],
  profile: MasterProfile,
): string[] {
  const existing = new Set(profile.sections.map((s) => s.id))
  const kept = savedOrder.filter((id) => existing.has(id))
  const keptSet = new Set(kept)
  const appended = profile.sections
    .map((s) => s.id)
    .filter((id) => !keptSet.has(id))
  return [...kept, ...appended]
}
