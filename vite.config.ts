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

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from https://mivebe.github.io/cv-maker/ in production; root in dev.
  base: command === 'build' ? '/cv-maker/' : '/',
  plugins: [react(), tailwindcss(), brandIcons()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
