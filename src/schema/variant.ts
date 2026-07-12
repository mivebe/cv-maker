import { z } from 'zod'

/**
 * A CVVariant references the master profile (it does not copy it). It records
 * which master items to include, how to order/place sections, per-item text
 * overrides, and a theme. This is what delivers "one master -> many tailored
 * CVs" without data duplication: edit the master once, every variant updates.
 */

/** Preset theme ids. `ats` is the strict single-column, parser-safe theme. */
export const themePresetSchema = z.enum([
  'classic',
  'modern',
  'ats',
  'showcase',
])
export type ThemePreset = z.infer<typeof themePresetSchema>

/** How the avatar is masked. `none` renders the bare image (transparent cutout). */
export const avatarShapeSchema = z.enum([
  'none',
  'circle',
  'rounded',
  'squircle',
  'square',
  'arch',
  'blob',
])
export type AvatarShape = z.infer<typeof avatarShapeSchema>

export const chipStyleSchema = z.enum(['pill', 'box', 'plain'])
export const skillStyleSchema = z.enum(['chips', 'inline'])

/**
 * Design tokens for a variant's CV document. These map directly to CSS custom
 * properties / data attributes consumed by cv.css, so adding a token here and
 * wiring it in themeVars.ts is all it takes to expose a new design control.
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
  /** How stored dates are rendered; unparseable text ("Present") is untouched. */
  dateFormat: z
    .enum(['MMM yyyy', 'MMMM yyyy', 'MM/yyyy', 'yyyy-MM', 'yyyy'])
    .default('MMM yyyy'),
  /** Uppercase section headings. */
  uppercaseHeadings: z.boolean(),
  /** Uppercase the name in the header. */
  uppercaseName: z.boolean().default(false),
  /** Draw a rule under each section heading. */
  headingRule: z.boolean(),

  // ---- spacing (explicit, on top of `density`) ----
  /** Space between sections, in px at density 1. */
  sectionGap: z.number().default(18),
  /** Space between items inside a section, in px at density 1. */
  itemGap: z.number().default(12),
  /** Width of the side column as a fraction of the main column. */
  sideColumnRatio: z.number().default(0.62),
  /** Gap between the two columns, in px. */
  columnGap: z.number().default(28),

  // ---- header / avatar ----
  headerAlign: z.enum(['left', 'center']).default('left'),
  /** Show the avatar at all (content still stores the photo). */
  showAvatar: z.boolean().default(true),
  avatarShape: avatarShapeSchema.default('rounded'),
  avatarPosition: z.enum(['left', 'right']).default('right'),
  /** Rendered avatar width in mm. */
  avatarSize: z.number().default(30),
  /** Frame proportion, width ÷ height. 1 = square; < 1 = portrait rectangle. */
  avatarRatio: z.number().default(1),
  /** Scale the image inside its frame (crop in/out). */
  avatarZoom: z.number().default(1),
  /** Framing offsets, in % of the frame (object-position). */
  avatarOffsetX: z.number().default(50),
  avatarOffsetY: z.number().default(50),
  /** Ring/border width around the avatar, in px. 0 = none. */
  avatarRing: z.number().default(0),
  avatarRingColor: z.string().default('#e5e7eb'),
  avatarGrayscale: z.boolean().default(false),
  /** Backing plate behind a cut-out (transparent) portrait. '' = none. */
  avatarBackdrop: z.string().default(''),

  // ---- decoration ----
  /** Render icons (contact, dates, locations, portfolios, totals). */
  showIcons: z.boolean().default(true),
  /** Tint brand icons with their official colors (off = monochrome accent). */
  brandColorIcons: z.boolean().default(true),
  chipStyle: chipStyleSchema.default('pill'),
  skillStyle: skillStyleSchema.default('chips'),
  /** Dashed separator between items in a section. */
  itemDivider: z.boolean().default(true),
  /** Color of item titles (role / project name). Empty = fall back to accent. */
  titleColor: z.string().default(''),
  linkColor: z.string().default(''),
  badgeColor: z.string().default('#16a34a'),
  /** Columns in the TOTALS grid. */
  totalsColumns: z.number().default(4),
  /** Vertical rule between the columns of the TOTALS grid. */
  totalsDivider: z.boolean().default(true),
})
export type ThemeConfig = z.infer<typeof themeConfigSchema>

/** Where a section sits on the page. */
export const sectionPlacementSchema = z.object({
  /** `full` spans both columns; `main`/`side` pick a column in 2-col themes. */
  column: z.enum(['main', 'side', 'full']).default('main'),
  /** Start a new printed page before this section. */
  pageBreakBefore: z.boolean().default(false),
})
export type SectionPlacement = z.infer<typeof sectionPlacementSchema>

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
  /**
   * sectionKey -> heading text, overriding the default label ("Skills" ->
   * "Technical Skills"). Per-variant, because the right wording depends on who
   * is reading: a human likes "Portfolios", an ATS wants "Projects".
   */
  sectionTitles: z.record(z.string(), z.string()).default({}),
  /**
   * sectionKey -> placement. Absent keys fall back to a per-kind default
   * (skills/education to the side column), so old variants keep their layout.
   */
  sectionLayout: z.record(z.string(), sectionPlacementSchema).default({}),
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
