import type { CSSProperties } from 'react'
import type { ThemeConfig } from '../schema'

/** Map a ThemeConfig to the CSS custom properties consumed by cv.css. */
export function themeToStyle(theme: ThemeConfig): CSSProperties {
  const d = theme.density
  return {
    '--cv-font-family': theme.fontFamily,
    '--cv-font-size': `${theme.fontSize}pt`,
    '--cv-line-height': String(theme.lineHeight),
    '--cv-accent': theme.accentColor,
    '--cv-text': theme.textColor,
    '--cv-heading': theme.headingColor,
    '--cv-margin': `${theme.pageMargin}mm`,

    // Spacing: the explicit tokens, scaled by the density multiplier.
    '--cv-gap': `${(theme.itemGap * d).toFixed(1)}px`,
    '--cv-section-gap': `${(theme.sectionGap * d).toFixed(1)}px`,
    '--cv-column-gap': `${theme.columnGap}px`,
    // Built here, not in CSS: `calc()` cannot multiply an `fr` unit.
    '--cv-cols-template': `1fr ${theme.sideColumnRatio}fr`,

    // Item titles and links fall back to the accent when left unset.
    '--cv-title': theme.titleColor || theme.accentColor,
    '--cv-link': theme.linkColor || theme.accentColor,
    '--cv-badge': theme.badgeColor,

    '--cv-avatar-size': `${theme.avatarSize}mm`,
    // Height comes from the frame ratio (width ÷ height), so a rectangle frame
    // is just a ratio away from the square default.
    '--cv-avatar-height': `${(theme.avatarSize / (theme.avatarRatio || 1)).toFixed(1)}mm`,
    '--cv-avatar-ring': `${theme.avatarRing}px`,
    '--cv-avatar-ring-color': theme.avatarRingColor,
    '--cv-avatar-backdrop': theme.avatarBackdrop || 'transparent',

    '--cv-totals-cols': String(theme.totalsColumns),

    '--cv-bullet': theme.bulletColor || 'var(--cv-muted)',
    '--cv-bullet-indent': `${theme.bulletIndent}em`,

    // Logo box sizes are handed to <CVIcon> in px (it sizes inline), so only
    // these need to reach CSS.
    '--cv-brand-watermark-opacity': String(theme.brandingWatermarkOpacity),
    // A third of the page margin: wide enough to read as a deliberate stripe,
    // and guaranteed to stay inside the blank band beside the text.
    '--cv-brand-edge-width': `${(theme.pageMargin / 3).toFixed(1)}mm`,
  } as CSSProperties
}

/** Data attributes that toggle boolean/enum style rules in cv.css. */
export function themeDataAttrs(theme: ThemeConfig) {
  return {
    'data-uppercase': String(theme.uppercaseHeadings),
    'data-uppercase-name': String(theme.uppercaseName),
    'data-rule': String(theme.headingRule),
    'data-icons': String(theme.showIcons),
    'data-brand-icons': String(theme.brandColorIcons),
    'data-chips': theme.chipStyle,
    'data-chip-fill': theme.chipFill,
    'data-bullets': theme.bulletStyle,
    'data-skills': theme.skillStyle,
    'data-divider': String(theme.itemDivider),
    'data-header-align': theme.headerAlign,
    'data-avatar-pos': theme.avatarPosition,
    'data-avatar-gray': String(theme.avatarGrayscale),
    'data-totals-divider': String(theme.totalsDivider),
  }
}
