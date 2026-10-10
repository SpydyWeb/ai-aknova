// The live site: `npm run build`, then `npm start`.
// Serves the built app, the admin panel's API, uploaded files, and a ready-made HTML page for
// every address so search engines and AI assistants see real titles and text.
import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSite, sendFile } from './core.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const clean = join(dist, '_template.html')
if (!existsSync(join(dist, 'index.html'))) {
  console.error('The site has not been built yet. Run "npm run build" first.')
  process.exit(1)
}
const template = readFileSync(existsSync(clean) ? clean : join(dist, 'index.html'), 'utf8')
const site = createSite(root)
const port = Number(process.env.PORT) || 3000

createServer(async (req, res) => {
  try {
    if (await site.api(req, res)) return
    if (site.files(req, res)) return
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      return res.end()
    }
    const path = decodeURIComponent(new URL(req.url, 'http://site').pathname)
    // Real files from the build: scripts, styles, fonts, the logo.
    if (extname(path)) {
      const file = normalize(join(dist, path))
      if (file.startsWith(dist) && !path.endsWith('.html') && sendFile(req, res, file, path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600')) return
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('Not found')
    }
    const { html, missing } = site.page(template, path)
    res.writeHead(missing ? 404 : 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      // The site and its admin panel may not be shown inside another website's frame.
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    res.end(req.method === 'HEAD' ? undefined : html)
  } catch (e) {
    console.error(e)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Something went wrong.')
  }
}).listen(port, () => {
  console.log(`Site:  http://localhost:${port}`)
  console.log(`Admin: http://localhost:${port}/admin`)
})
