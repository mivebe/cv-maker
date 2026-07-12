/**
 * THE ONLY FILE THAT IMPORTS THE BRAND-ICON PACKAGE.
 *
 * Everything else in the app talks to `BRAND_ICONS` (a plain
 * `slug -> {title, hex, path}` map over a 24x24 viewBox). Swapping the upstream
 * `simple-icons` dependency for the internal fork is therefore a change to this
 * file alone: keep the exported shape, change the import.
 *
 * Icons are imported by name (never `import * as si`) so the bundler tree-shakes
 * the other ~3.4k icons out of the build.
 */
import {
  siCss,
  siExpo,
  siGithub,
  siGsap,
  siHtml5,
  siJavascript,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siPastebin,
  siReact,
  siSketchfab,
  siSpine,
  siThreedotjs,
  siTypescript,
} from 'simple-icons'

/** A monochrome brand glyph: one path on a 24x24 grid, plus its brand color. */
export interface BrandIcon {
  title: string
  /** Brand color, `RRGGBB` (no leading `#`) - matches the simple-icons shape. */
  hex: string
  path: string
}

/**
 * Brands the upstream package does not ship (LinkedIn and PixiJS were removed /
 * never added). Authored here on the same 24x24 grid; these are the icons to
 * upstream into the fork, after which they can
 * simply move into the import list above.
 */
export const LOCAL_BRAND_ICONS: Record<string, BrandIcon> = {
  linkedin: {
    title: 'LinkedIn',
    hex: '0A66C2',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  },
  pixijs: {
    title: 'PixiJS',
    hex: 'E72264',
    // Rounded "P" mark: outer disc with a counter-punched bowl and stem.
    path: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM8.4 5.4h4.65c2.734 0 4.5 1.63 4.5 4.2 0 2.57-1.766 4.2-4.5 4.2h-1.95v4.8H8.4V5.4zm2.7 2.4v3.6h1.8c1.09 0 1.8-.66 1.8-1.8s-.71-1.8-1.8-1.8h-1.8z',
  },
}

/** Every brand glyph available to the app, keyed by a stable slug. */
export const BRAND_ICONS: Record<string, BrandIcon> = {
  github: siGithub,
  pastebin: siPastebin,
  sketchfab: siSketchfab,
  javascript: siJavascript,
  typescript: siTypescript,
  html5: siHtml5,
  css: siCss,
  nodedotjs: siNodedotjs,
  nestjs: siNestjs,
  react: siReact,
  expo: siExpo,
  nextdotjs: siNextdotjs,
  threedotjs: siThreedotjs,
  gsap: siGsap,
  spine: siSpine,
  ...LOCAL_BRAND_ICONS,
}
