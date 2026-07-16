import { z } from 'zod'

/**
 * The master profile is the single source of truth for CV content.
 * Zod schemas here validate JSON imports AND generate the TS types used
 * across the whole app (see `index.ts` re-exports).
 *
 * Dates are freeform strings ("2021", "Jan 2020", "Present") on purpose:
 * users and ATS parsers both tolerate varied formats, and strict date
 * parsing would only get in the way of a personal tool.
 *
 * Presentation-only fields (`icon`, `badge`, `tags`, ...) live on the content
 * model rather than the theme because they are per-item facts ("this portfolio
 * entry is a GitHub repo and is live"), not styling choices. Every one of them
 * has a Zod default so older exports and older persisted state still parse.
 */

/** An icon reference: a registry key (see cv/icons.tsx) or an image URL/data URL. */
export const iconRef = z.string().default('')

export const linkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  /** Icon shown before the link in the header (e.g. `github`, `linkedin`). */
  icon: iconRef,
})

export const basicsSchema = z.object({
  name: z.string(),
  headline: z.string(),
  email: z.string(),
  /** Dialing code, stored apart from the number so it can be picked, e.g. `+44`. */
  phoneCode: z.string().default(''),
  phone: z.string(),
  location: z.string(),
  summary: z.string(),
  links: z.array(linkSchema),
  /** Avatar as a data URL (survives JSON export) or a remote image URL. */
  photo: z.string().default(''),
  photoAlt: z.string().default(''),
})

export const experienceItemSchema = z.object({
  id: z.string(),
  role: z.string(),
  organization: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  summary: z.string(),
  highlights: z.array(z.string()),
  /** Optional chip group rendered under the header (e.g. a tech stack). */
  tagsLabel: z.string().default(''),
  tags: z.array(z.string()).default([]),
})

export const educationItemSchema = z.object({
  id: z.string(),
  degree: z.string(),
  institution: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  details: z.string(),
})

export const skillGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(z.string()),
})

export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  /** Icon before the project name (e.g. `github`, `globe`). */
  icon: iconRef,
  /** Small pill next to the name, e.g. "live". */
  badge: z.string().default(''),
  /** Right-aligned note on the title row, e.g. "iOS AppStore". */
  meta: z.string().default(''),
})

export const customItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  date: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  icon: iconRef,
  /** Right-aligned note on the title row, e.g. "AltStore & SideStore". */
  meta: z.string().default(''),
  /** Legend of the chip group, e.g. "TechStack". Empty = no legend. */
  tagsLabel: z.string().default(''),
  tags: z.array(z.string()).default([]),
})

/** One cell of the TOTALS grid: an icon, a label and a value ("7y"). */
export const totalItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  icon: iconRef,
})

/** One chart slice/bar. Legend rows are marker + title + value, no subtitle. */
export const chartItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number().default(0),
  icon: iconRef,
})

export const sliderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().default(''),
  /** 1..options.sliderSteps. Clamped at render. */
  value: z.number().default(1),
})

export const titleItemSchema = z.object({
  id: z.string(),
  icon: iconRef,
  title: z.string(),
  subtitle: z.string().default(''),
})

/** The four stages a language can be at; see LANGUAGE_STAGES in lib/sections. */
export const languageItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 1..4, indexes LANGUAGE_STAGES. */
  level: z.number().min(1).max(4).default(1),
})

/**
 * Per-section display settings. One flat bag rather than a per-kind union,
 * because the variant override layers need `.partial()` and `.partial()` on a
 * union is awkward. Irrelevant keys are inert: a `languages` section carries a
 * `chartType` it never reads.
 *
 * Stored sparse (see `sectionBaseSchema.options`): a section only records what
 * the user explicitly set, and the kind's baseline (KIND_OPTION_DEFAULTS in
 * lib/sections.ts) fills the rest at resolve time. That is what lets a
 * variant's `optionDefaults` policy layer sit between the two.
 */
export const sectionOptionsSchema = z.object({
  // --- shared, honoured by any kind that has the field ---
  /** Hide the summary / details / description text. */
  showDescription: z.boolean().default(true),
  /** Hide the bullet list. */
  showHighlights: z.boolean().default(true),
  /** `below` keeps the date in the meta row; `right` moves it to the title row. */
  datePosition: z.enum(['below', 'right']).default('below'),
  /** Rule between stacked rows (was theme.itemDivider / theme.totalsDivider). */
  rowDividers: z.boolean().default(false),
  /** Gated by theme.showIcons; this can additionally suppress just this section. */
  showIcons: z.boolean().default(true),
  /** Lay items out in this many equal columns (was customSection.columns). */
  columns: z.number().default(1),

  // --- chart ---
  chartType: z.enum(['pie', 'donut', 'bar', 'hbar']).default('pie'),
  chartMarker: z.enum(['letter', 'number', 'none']).default('letter'),
  chartPalette: z.enum(['accent', 'categorical']).default('accent'),
  chartShowValue: z.boolean().default(true),
  /** `auto` = percent of the section total for pie/donut, raw for bar/hbar. */
  chartValueFormat: z.enum(['auto', 'percent', 'raw']).default('auto'),

  // --- sliders ---
  sliderSteps: z.number().min(2).max(10).default(5),
  sliderStartLabel: z.string().default(''),
  sliderEndLabel: z.string().default(''),
  sliderShowLabels: z.boolean().default(true),

  // --- title list ---
  showSubtitle: z.boolean().default(true),

  // --- languages ---
  languageDisplay: z.enum(['slider', 'notches', 'words']).default('words'),
  languageShowLabels: z.boolean().default(true),
})

export const sectionBaseSchema = z.object({
  id: z.string(),
  /** Heading text. Empty falls back to the kind's default label ("Experience"). */
  title: z.string().default(''),
  /** Small line under the section title. */
  subtitle: z.string().default(''),
  /** Only the options the user explicitly set on this section. */
  options: sectionOptionsSchema.partial().default({}),
})

/**
 * Every section is an instance with an id, a kind and a title - any number of
 * any kind, in one ordered array. `items` is the old custom section; `banner`
 * is a heading-only block (a page-2 title), a kind of its own rather than a
 * display mode now that every section has an options bag.
 */
export const sectionSchema = z.discriminatedUnion('kind', [
  sectionBaseSchema.extend({
    kind: z.literal('experience'),
    items: z.array(experienceItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('education'),
    items: z.array(educationItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('skills'),
    items: z.array(skillGroupSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('projects'),
    items: z.array(projectItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('totals'),
    items: z.array(totalItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('items'),
    items: z.array(customItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('banner'),
    items: z.array(z.never()).default([]),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('chart'),
    items: z.array(chartItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('sliders'),
    items: z.array(sliderItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('titleList'),
    items: z.array(titleItemSchema),
  }),
  sectionBaseSchema.extend({
    kind: z.literal('languages'),
    items: z.array(languageItemSchema),
  }),
])

/**
 * The organisation issuing the CV (an agency, a studio, a recruiter) as opposed
 * to the person it describes. It lives on the profile rather than the theme
 * because these are facts ("137 issued this, on 2026-07-16"), not styling; the
 * theme only decides which of the slots below get drawn, so an ATS variant can
 * strip the branding while a client-facing variant keeps it.
 */
export const brandingSchema = z
  .object({
    /** Master switch for the content; the theme still decides each slot. */
    enabled: z.boolean().default(false),
    company: z.string().default(''),
    tagline: z.string().default(''),
    url: z.string().default(''),
    /** Icon ref: a data URL (survives export), an image URL, or a registry key. */
    logo: iconRef,
    logoAlt: z.string().default(''),
    /** The brand's colour, kept so the editor can push it into the theme accent. */
    accentColor: z.string().default(''),
    /** Who the CV was prepared for, e.g. "Prepared for Acme Corp". */
    issuedFor: z.string().default(''),
    /** Freeform issue date, e.g. "July 2026". */
    issuedDate: z.string().default(''),
    /** Issuer contact line printed in the footer, e.g. "hello@137.studio". */
    contact: z.string().default(''),
    /** Small print, e.g. "Confidential — not for redistribution". */
    note: z.string().default(''),
    /** Reference/candidate id the issuer tracks this document by. */
    reference: z.string().default(''),
  })
  .default({})

/**
 * `basics` and `branding` stay outside the sections array. They are not
 * sections: one is the document header, the other is a watermark. Neither
 * orders, repeats, or can be absent the way a section can.
 */
export const masterProfileSchema = z.object({
  basics: basicsSchema,
  sections: z.array(sectionSchema).default([]),
  branding: brandingSchema,
})

export type Link = z.infer<typeof linkSchema>
export type Basics = z.infer<typeof basicsSchema>
export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type CustomItem = z.infer<typeof customItemSchema>
export type TotalItem = z.infer<typeof totalItemSchema>
export type ChartItem = z.infer<typeof chartItemSchema>
export type SliderItem = z.infer<typeof sliderItemSchema>
export type TitleItem = z.infer<typeof titleItemSchema>
export type LanguageItem = z.infer<typeof languageItemSchema>
export type SectionOptions = z.infer<typeof sectionOptionsSchema>
export type Section = z.infer<typeof sectionSchema>
export type SectionKind = Section['kind']
/** A section's item type, given its kind. */
export type SectionItem = Section['items'][number]
export type Branding = z.infer<typeof brandingSchema>
export type MasterProfile = z.infer<typeof masterProfileSchema>
