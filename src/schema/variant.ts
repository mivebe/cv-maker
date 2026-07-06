import { z } from 'zod'

/**
 * A CVVariant references the master profile (it does not copy it). It records
 * which master items to include, how to order sections, per-item text
 * overrides, and a theme. This is what delivers "one master -> many tailored
 * CVs" without data duplication: edit the master once, every variant updates.
 */

/** Preset theme ids. `ats` is the strict single-column, parser-safe theme. */
export const themePresetSchema = z.enum(['classic', 'modern', 'ats'])
export type ThemePreset = z.infer<typeof themePresetSchema>

/**
 * Design tokens for a variant's CV document. These map directly to CSS custom
 * properties consumed by cv.css, so adding a token here + wiring it in the
 * renderer is all it takes to expose a new design control (M6).
 */
export const themeConfigSchema = z.object({
  preset: themePresetSchema,
  fontFamily: z.string(),
  /** Base body font size in points. */
  fontSize: z.number(),
  lineHeight: z.number(),
  /** Vertical rhythm multiplier; higher = more spacious. */
  density: z.number(),
  accentColor: z.string(),
  textColor: z.string(),
  headingColor: z.string(),
  columns: z.union([z.literal(1), z.literal(2)]),
  /** Page margin in millimetres. */
  pageMargin: z.number(),
  /** Uppercase section headings. */
  uppercaseHeadings: z.boolean(),
  /** Draw a rule under each section heading. */
  headingRule: z.boolean(),
})
export type ThemeConfig = z.infer<typeof themeConfigSchema>

export const variantSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetRole: z.string(),
  /**
   * itemId -> included?. Absence means "included" (new master items appear in
   * every variant by default). Set false to exclude an item from this variant.
   */
  include: z.record(z.string(), z.boolean()),
  /** Ordered list of section keys (see sectionKeys in lib). */
  sectionOrder: z.array(z.string()),
  /** Section keys hidden entirely in this variant. */
  hiddenSections: z.array(z.string()),
  /** itemId -> shallow field overrides applied on top of the master item. */
  overrides: z.record(z.string(), z.record(z.string(), z.unknown())),
  /** Tailored headline/summary that override the master basics for this variant. */
  basicsOverride: z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
  }),
  theme: themeConfigSchema,
})
export type CVVariant = z.infer<typeof variantSchema>
