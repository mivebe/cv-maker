/**
 * Path math and palette derivation for the chart section. Hand-rolled on
 * purpose: src/cv/ is plain CSS/SVG by design so the print output stays
 * predictable, and a chart library would pull ~100kb and risk PDF drift for
 * four shapes that are a few dozen lines of trigonometry.
 */

/** A fixed distinguishable ramp for slices that are unrelated categories. */
const CATEGORICAL = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0d9488',
  '#db2777',
  '#64748b',
]

interface HSL {
  h: number
  s: number
  l: number
}

function hexToHsl(hex: string): HSL | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 0xff) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s, l }
}

function hslCss({ h, s, l }: HSL): string {
  return `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`
}

/**
 * Slice colours. `accent` derives them from the theme's accent by walking
 * lightness (and nudging hue) so a chart is on-brand in every preset with no
 * second palette to maintain; `categorical` is the fixed ramp for when the
 * slices are unrelated categories rather than parts of one thing.
 */
export function chartColors(
  accentColor: string,
  count: number,
  palette: 'accent' | 'categorical',
): string[] {
  if (palette === 'categorical') {
    return Array.from({ length: count }, (_, i) => CATEGORICAL[i % CATEGORICAL.length])
  }
  const base = hexToHsl(accentColor) ?? { h: 215, s: 0.55, l: 0.45 }
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1)
    // First slice darkest; later slices lighter and slightly hue-shifted, so
    // neighbours stay tellable-apart even for a grayscale accent.
    const l = 0.32 + t * 0.42
    const h = (base.h + (i - (count - 1) / 2) * 10 + 360) % 360
    const s = base.s === 0 ? 0 : Math.min(1, base.s * (1 - t * 0.25))
    return hslCss({ h, s, l })
  })
}

const TAU = Math.PI * 2

/** Point on a circle; angles start at 12 o'clock and run clockwise. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  frac: number,
): [number, number] {
  const a = frac * TAU - Math.PI / 2
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/**
 * SVG path for one pie/donut slice from `from` to `to` (fractions of the whole,
 * 0..1). `rInner` 0 draws a pie wedge. A full-circle slice is the caller's
 * special case - an arc whose start and end coincide draws nothing.
 */
export function slicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  from: number,
  to: number,
): string {
  const large = to - from > 0.5 ? 1 : 0
  const [x0, y0] = polar(cx, cy, rOuter, from)
  const [x1, y1] = polar(cx, cy, rOuter, to)
  if (rInner <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${x0.toFixed(3)} ${y0.toFixed(3)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`,
      'Z',
    ].join(' ')
  }
  const [x2, y2] = polar(cx, cy, rInner, to)
  const [x3, y3] = polar(cx, cy, rInner, from)
  return [
    `M ${x0.toFixed(3)} ${y0.toFixed(3)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`,
    `L ${x2.toFixed(3)} ${y2.toFixed(3)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${x3.toFixed(3)} ${y3.toFixed(3)}`,
    'Z',
  ].join(' ')
}

/** The marker glyph for slice `i`: A/B/C, 1/2/3, or nothing. */
export function chartMarker(
  style: 'letter' | 'number' | 'none',
  i: number,
): string {
  if (style === 'letter') return String.fromCharCode(65 + (i % 26))
  if (style === 'number') return String(i + 1)
  return ''
}
