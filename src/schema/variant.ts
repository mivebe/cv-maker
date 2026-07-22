import { z } from 'zod'
import { sectionOptionsSchema } from './profile'

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

/** Marker drawn in front of each highlight. `none` indents with no marker. */
export const bulletStyleSchema = z.enum([
  'disc',
  'circle',
  'square',
  'dash',
  'arrow',
  'chevron',
  'check',
  'none',
])
export type BulletStyle = z.infer<typeof bulletStyleSchema>

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
  /** How section headings align. */
  headingAlign: z.enum(['left', 'center']).default('left'),

  // ---- backgrounds ----
  /** Sheet background. Empty = white. */
  pageBackground: z.string().default(''),
  /**
   * Band behind the header, bleeding through the page margins to the sheet
   * edges (the FlowCV look). Empty = none.
   */
  headerBackground: z.string().default(''),
  /** Band behind each section heading. Empty = none. */
  headingBackground: z.string().default(''),

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
  /**
   * What fills the space under the name and headline, beside the contact
   * column: the profile links (leaving email/phone/location on the right),
   * the summary (instead of the full-width paragraph below the header row),
   * or nothing.
   */
  headerFill: z.enum(['none', 'links', 'summary']).default('none'),
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
  /** Fill behind chips, to make tag groups (e.g. skills) stand out. */
  chipFill: z.enum(['none', 'muted', 'accent']).default('none'),
  skillStyle: skillStyleSchema.default('chips'),
  /** Marker in front of each highlight bullet. */
  bulletStyle: bulletStyleSchema.default('disc'),
  /** Marker color. Empty = the muted body color. */
  bulletColor: z.string().default(''),
  /** Indent of the bullet list, in em of body text. */
  bulletIndent: z.number().default(1.1),
  /** Color of item titles (role / project name). Empty = fall back to accent. */
  titleColor: z.string().default(''),
  linkColor: z.string().default(''),
  badgeColor: z.string().default('#16a34a'),

  // ---- issuer branding ----
  // Which branding slots this variant draws. The content lives on the profile
  // (see brandingSchema); these only say where it appears, so the same issuer
  // details can be loud on a client-facing variant and absent on an ATS one.
  //
  // Every slot costs the document zero space. The CV belongs to the candidate,
  // so the issuer never pushes their content around: each slot is positioned
  // against the sheet, and lives either in a page margin - blank by definition -
  // or behind the text. Nothing here can move a line or a page break.
  /** Letterhead mark in the top margin of every page. */
  brandingMark: z.boolean().default(true),
  /** Issuer strip in the bottom margin of every page. */
  brandingFooter: z.boolean().default(false),
  /** What sits behind the content: one big faint logo, or a repeating tile. */
  brandingBackdrop: z.enum(['none', 'watermark', 'tile']).default('none'),
  /** Accent-coloured stripe down the sheet's left edge. */
  brandingEdge: z.boolean().default(false),
  /** Letterhead logo size, in mm. Clamped to the margin so it cannot overflow. */
  brandingLogoSize: z.number().default(9),
  /** Watermark logo size, in mm. Ignored by the `tile` backdrop. */
  brandingWatermarkSize: z.number().default(95),
  /** Tile repeat size, in mm. */
  brandingTileSize: z.number().default(26),
  /** Backdrop opacity, 0-1. Kept low: it must never fight the text. */
  brandingWatermarkOpacity: z.number().default(0.05),
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
  /** Ordered list of section ids (see profile.sections). */
  sectionOrder: z.array(z.string()),
  /** Section ids hidden entirely in this variant. */
  hiddenSections: z.array(z.string()),
  /**
   * sectionId -> heading text, overriding the section's own title ("Skills" ->
   * "Technical Skills"). Per-variant, because the right wording depends on who
   * is reading: a human likes "Portfolios", an ATS wants "Projects".
   */
  sectionTitles: z.record(z.string(), z.string()).default({}),
  /**
   * sectionId -> placement. Absent ids fall back to a per-kind default
   * (skills/education to the side column), so old variants keep their layout.
   */
  sectionLayout: z.record(z.string(), sectionPlacementSchema).default({}),
  /**
   * Option overrides applied to every section - this is how an ATS variant
   * strips decoration in one move. Deliberately outranks the section's own
   * options in the resolve merge: it is a policy, and a policy any section
   * could dodge by simply having a value set would be no policy at all.
   */
  optionDefaults: sectionOptionsSchema.partial().default({}),
  /** sectionId -> option overrides, applied on top of optionDefaults. */
  sectionOptions: z
    .record(z.string(), sectionOptionsSchema.partial())
    .default({}),
  /** itemId -> shallow field overrides applied on top of the master item. */
  overrides: z.record(z.string(), z.record(z.string(), z.unknown())),
  /** Tailored headline/summary/location that override the master basics for this variant. */
  basicsOverride: z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
    /** Per-variant location (e.g. target a local role) without touching master. */
    location: z.string().optional(),
  }),
  theme: themeConfigSchema,
})
export type CVVariant = z.infer<typeof variantSchema>
