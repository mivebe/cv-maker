import { z } from 'zod'

/**
 * The master profile is the single source of truth for CV content.
 * Zod schemas here validate JSON imports AND generate the TS types used
 * across the whole app (see `index.ts` re-exports).
 *
 * Dates are freeform strings ("2021", "Jan 2020", "Present") on purpose:
 * users and ATS parsers both tolerate varied formats, and strict date
 * parsing would only get in the way of a personal tool.
 */

export const linkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
})

export const basicsSchema = z.object({
  name: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  summary: z.string(),
  links: z.array(linkSchema),
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
})

export const customItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  date: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
})

export const customSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(customItemSchema),
})

export const masterProfileSchema = z.object({
  basics: basicsSchema,
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  custom: z.array(customSectionSchema),
})

export type Link = z.infer<typeof linkSchema>
export type Basics = z.infer<typeof basicsSchema>
export type ExperienceItem = z.infer<typeof experienceItemSchema>
export type EducationItem = z.infer<typeof educationItemSchema>
export type SkillGroup = z.infer<typeof skillGroupSchema>
export type ProjectItem = z.infer<typeof projectItemSchema>
export type CustomItem = z.infer<typeof customItemSchema>
export type CustomSection = z.infer<typeof customSectionSchema>
export type MasterProfile = z.infer<typeof masterProfileSchema>
