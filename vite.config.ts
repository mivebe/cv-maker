import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Serves `@mivebe/icons`' SVGs as static files under /brand-icons/.
 *
 * The package holds 3,713 icons and their path data is ~2.1 MB gzipped, so
 * bundling it to draw the ~20 a CV actually uses is not on. The app bundles
 * only the paths-free manifest and fetches a glyph's path the first time it
 * draws it; this plugin is what makes those files fetchable - from node_modules
 * in dev, copied into dist/ at build.
 *
 * Filenames are unhashed on purpose: the runtime asks for /brand-icons/<slug>.svg
 * by slug, so the URL has to be predictable.
 */
function brandIcons(): Plugin {
  const dir = path.resolve(__dirname, 'node_modules/@mivebe/icons/svg')
  const PREFIX = '/brand-icons/'

  return {
    name: 'brand-icons',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith(PREFIX)) return next()

        // The slug reaches us from the client: resolve inside `dir` or refuse.
        const name = path.basename(decodeURIComponent(url.slice(PREFIX.length)))
        const file = path.resolve(dir, name)
        if (path.dirname(file) !== dir || !fs.existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }

        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(fs.readFileSync(file))
      })
    },

    generateBundle() {
      for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith('.svg')) continue
        this.emitFile({
          type: 'asset',
          fileName: `brand-icons/${name}`,
          source: fs.readFileSync(path.join(dir, name)),
        })
      }
    },
  }
}

/**
 * Additional icon packs (Font Awesome Free, Entypo), same contract as
 * brandIcons: names only are bundled (via the `virtual:icon-pack-manifest`
 * module), the SVG itself is fetched from /icon-packs/<pack>/<name>.svg the
 * first time something draws it - node_modules in dev, copied into dist/ at
 * build. Freepik is deliberately absent: Flaticon's license does not allow
 * redistributing the files, so those enter as pasted image URLs instead.
 */
const ICON_PACKS: { route: string; dir: string }[] = [
  { route: 'fa-solid', dir: '@fortawesome/fontawesome-free/svgs/solid' },
  { route: 'fa-regular', dir: '@fortawesome/fontawesome-free/svgs/regular' },
  { route: 'fa-brands', dir: '@fortawesome/fontawesome-free/svgs/brands' },
  { route: 'entypo', dir: '@entypo-icons/core/icons' },
]

function iconPacks(): Plugin {
  const packs = ICON_PACKS.map((p) => ({
    ...p,
    abs: path.resolve(__dirname, 'node_modules', p.dir),
  }))
  const PREFIX = '/icon-packs/'
  const VIRTUAL = 'virtual:icon-pack-manifest'
  const RESOLVED = '\0' + VIRTUAL

  return {
    name: 'icon-packs',

    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      const manifest: Record<string, string[]> = {}
      for (const p of packs) {
        manifest[p.route] = fs
          .readdirSync(p.abs)
          .filter((f) => f.endsWith('.svg'))
          .map((f) => f.slice(0, -4))
      }
      return `export const packManifest = ${JSON.stringify(manifest)}`
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith(PREFIX)) return next()

        const [route, ...rest] = decodeURIComponent(
          url.slice(PREFIX.length),
        ).split('/')
        const pack = packs.find((p) => p.route === route)
        const name = path.basename(rest.join('/'))
        const file = pack ? path.resolve(pack.abs, name) : ''
        if (!pack || path.dirname(file) !== pack.abs || !fs.existsSync(file)) {
          res.statusCode = 404
          return res.end()
        }

        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(fs.readFileSync(file))
      })
    },

    generateBundle() {
      for (const p of packs) {
        for (const name of fs.readdirSync(p.abs)) {
          if (!name.endsWith('.svg')) continue
          this.emitFile({
            type: 'asset',
            fileName: `icon-packs/${p.route}/${name}`,
            source: fs.readFileSync(path.join(p.abs, name)),
          })
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://mivebe.github.io/cv-maker/ in production; root in dev.
  base: command === 'build' ? '/cv-maker/' : '/',
  plugins: [react(), tailwindcss(), brandIcons(), iconPacks()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
