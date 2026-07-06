import type { CSSProperties } from 'react'
import type { ThemeConfig } from '../schema'

/** Map a ThemeConfig to the CSS custom properties consumed by cv.css. */
export function themeToStyle(theme: ThemeConfig): CSSProperties {
  return {
    '--cv-font-family': theme.fontFamily,
    '--cv-font-size': `${theme.fontSize}pt`,
    '--cv-line-height': String(theme.lineHeight),
    '--cv-accent': theme.accentColor,
    '--cv-text': theme.textColor,
    '--cv-heading': theme.headingColor,
    '--cv-margin': `${theme.pageMargin}mm`,
    '--cv-gap': `${(12 * theme.density).toFixed(1)}px`,
    '--cv-section-gap': `${(18 * theme.density).toFixed(1)}px`,
  } as CSSProperties
}

/** Data attributes that toggle boolean style rules in cv.css. */
export function themeDataAttrs(theme: ThemeConfig) {
  return {
    'data-uppercase': String(theme.uppercaseHeadings),
    'data-rule': String(theme.headingRule),
  }
}
