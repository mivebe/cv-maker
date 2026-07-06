import type { ThemeConfig, ThemePreset } from '../schema'

/**
 * Base token sets for each preset. A variant's theme starts as a copy of one
 * of these and can then be freely tweaked (M6). The `ats` preset is deliberately
 * conservative: single column, no color, standard fonts - so it degrades to a
 * clean linear document that ATS parsers read in one reading order.
 */
export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  classic: {
    preset: 'classic',
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 10.5,
    lineHeight: 1.4,
    density: 1,
    accentColor: '#1f2937',
    textColor: '#111827',
    headingColor: '#111827',
    columns: 1,
    pageMargin: 18,
    uppercaseHeadings: true,
    headingRule: true,
  },
  modern: {
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
    uppercaseHeadings: true,
    headingRule: false,
  },
  ats: {
    preset: 'ats',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 11,
    lineHeight: 1.4,
    density: 1,
    accentColor: '#000000',
    textColor: '#000000',
    headingColor: '#000000',
    columns: 1,
    pageMargin: 20,
    uppercaseHeadings: true,
    headingRule: true,
  },
}

export const THEME_PRESET_LABELS: Record<ThemePreset, string> = {
  classic: 'Classic (serif, single column)',
  modern: 'Modern (sans, two columns)',
  ats: 'ATS-safe (strict single column)',
}

export function themeFromPreset(preset: ThemePreset): ThemeConfig {
  return { ...THEME_PRESETS[preset] }
}
