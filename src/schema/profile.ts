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

export const customSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(customItemSchema),
  /** Small line under the section title. */
  subtitle: z.string().default(''),
  /**
   * `items` renders a normal section; `banner` renders just the title/subtitle
   * as a centered full-width heading (used for a page-2 title block).
   */
  display: z.enum(['items', 'banner']).default('items'),
  /**
   * Lay the items out in this many equal columns (a compact grid for short
   * entries like languages or awards). 1 = the default full-width stack.
   */
  columns: z.number().default(1),
})

/** One cell of the TOTALS grid: an icon, a label and a value ("7y"). */
export const totalItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  icon: iconRef,
})

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

export const masterProfileSchema = z.object({
  basics: basicsSchema,
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  custom: z.array(customSectionSchema),
  totals: z.array(totalItemSchema).default([]),
  branding: brandingSchema,
})

export type Link = z.infer<typeof linkSchema>
export type Basics = z.infer<typeof basicsSchema>
export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type CustomItem = z.infer<typeof customItemSchema>
export type CustomSection = z.infer<typeof customSectionSchema>
export type TotalItem = z.infer<typeof totalItemSchema>
export type Branding = z.infer<typeof brandingSchema>
export type MasterProfile = z.infer<typeof masterProfileSchema>
