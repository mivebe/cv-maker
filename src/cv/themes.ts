import type { SectionOptions, ThemeConfig, ThemePreset } from '../schema'

/**
 * Base token sets for each preset. A variant's theme starts as a copy of one of
 * these and can then be freely tweaked. `ats` is deliberately conservative -
 * single column, no color, no icons, no chips - so it degrades to a clean linear
 * document that ATS parsers read in one reading order. `showcase` is the
 * opposite end: the icon-rich, two-column, chip-and-avatar layout.
 */

/** Tokens shared by every preset; each preset overrides what it cares about. */
const BASE: Omit<ThemeConfig, 'preset'> = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 10.5,
  lineHeight: 1.4,
  density: 1,
  accentColor: '#1f2937',
  textColor: '#111827',
  headingColor: '#111827',
  columns: 1,
  pageMargin: 18,
  dateFormat: 'MMM yyyy',
  uppercaseHeadings: true,
  uppercaseName: false,
  headingRule: true,

  sectionGap: 18,
  itemGap: 12,
  sideColumnRatio: 0.62,
  columnGap: 28,

  headerAlign: 'left',
  headerFill: 'none',
  showAvatar: true,
  avatarShape: 'rounded',
  avatarPosition: 'right',
  avatarSize: 30,
  avatarRatio: 1,
  avatarZoom: 1,
  avatarOffsetX: 50,
  avatarOffsetY: 50,
  avatarRing: 0,
  avatarRingColor: '#e5e7eb',
  avatarGrayscale: false,
  avatarBackdrop: '',

  showIcons: true,
  brandColorIcons: true,
  chipStyle: 'pill',
  chipFill: 'none',
  skillStyle: 'chips',
  bulletStyle: 'disc',
  bulletColor: '',
  bulletIndent: 1.1,
  titleColor: '',
  linkColor: '',
  badgeColor: '#16a34a',

  brandingMark: true,
  brandingFooter: false,
  brandingBackdrop: 'none',
  brandingEdge: false,
  brandingLogoSize: 9,
  brandingWatermarkSize: 95,
  brandingTileSize: 26,
  brandingWatermarkOpacity: 0.05,
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  classic: {
    ...BASE,
    preset: 'classic',
    showAvatar: false,
    skillStyle: 'inline',
    chipStyle: 'plain',
  },
  modern: {
    ...BASE,
    preset: 'modern',
    fontFamily: '"Helvetica Neue", Arial, system-ui, sans-serif',
    fontSize: 10,
    lineHeight: 1.45,
    density: 1.1,
    accentColor: '#2563eb',
    textColor: '#1e293b',
    headingColor: '#0f172a',
    columns: 2,
    pageMargin: 14,
    headingRule: false,
    avatarShape: 'circle',
    // The one-page-minded preset: the summary rides beside the contacts
    // instead of costing the page a full-width paragraph.
    headerFill: 'summary',
  },
  showcase: {
    ...BASE,
    preset: 'showcase',
    fontFamily:
      '"Geist Variable", "Helvetica Neue", Arial, system-ui, sans-serif',
    fontSize: 9.5,
    lineHeight: 1.4,
    density: 0.95,
    accentColor: '#2f80ed',
    textColor: '#1f2933',
    headingColor: '#111827',
    columns: 2,
    pageMargin: 12,
    uppercaseHeadings: true,
    uppercaseName: true,
    headingRule: true,
    sideColumnRatio: 0.78,
    columnGap: 32,
    avatarShape: 'rounded',
    avatarPosition: 'right',
    avatarSize: 32,
    badgeColor: '#16a34a',
    // Profile links sit under the name, contact details on the right - the
    // link-heavy preset is the one with blank space under its big name.
    headerFill: 'links',
    brandingBackdrop: 'watermark',
  },
  ats: {
    ...BASE,
    preset: 'ats',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 11,
    lineHeight: 1.4,
    accentColor: '#000000',
    textColor: '#000000',
    headingColor: '#000000',
    columns: 1,
    pageMargin: 20,
    // Everything decorative is off: an ATS reads text, and anything that is not
    // text is either noise or a parsing hazard.
    showAvatar: false,
    showIcons: false,
    chipStyle: 'plain',
    skillStyle: 'inline',
    // A plain disc is the one marker every PDF text extractor turns back into a
    // list item; a glyph like → or ✓ can come out as mojibake.
    bulletStyle: 'disc',
    // A logo is an image with no text layer, and a backdrop sits *behind* the
    // text: both are noise to a parser, so the issuer never reaches this preset.
    brandingMark: false,
    brandingFooter: false,
    brandingBackdrop: 'none',
    brandingEdge: false,
  },
}

/**
 * The section-options policy each preset implies (variant.optionDefaults).
 * Picking a preset replaces the variant's policy with this, the same way it
 * replaces the whole theme: `ats` is the reason the layer exists - a pie chart
 * with letter markers or a notch bar carries no text, so switching a variant
 * to ATS must strip that decoration from every section at once.
 */
export const PRESET_OPTION_DEFAULTS: Record<
  ThemePreset,
  Partial<SectionOptions>
> = {
  classic: {},
  modern: {},
  showcase: {},
  ats: {
    languageDisplay: 'words',
    chartMarker: 'none',
    showIcons: false,
    rowDividers: false,
  },
}

export const THEME_PRESET_LABELS: Record<ThemePreset, string> = {
  classic: 'Classic (serif, single column)',
  modern: 'Modern (sans, two columns)',
  showcase: 'Showcase (icons, chips, avatar)',
  ats: 'ATS-safe (strict single column)',
}

export function themeFromPreset(preset: ThemePreset): ThemeConfig {
  return { ...THEME_PRESETS[preset] }
}
