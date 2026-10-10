// Runs after `vite build`. Only matters if the site is put on plain file hosting with no server:
// it writes one real HTML file per page, plus sitemap.xml, robots.txt and llms.txt, from the
// content as it is right now. With `npm start` the server makes all of these fresh on every visit.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSite } from '../server/core.mjs'
import { setContent } from '../src/data.js'
import { llmsTxt, robotsTxt, routes, sitemapXml } from '../src/seo.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
// The untouched app shell, kept for the server to fill in.
copyFileSync(join(dist, 'index.html'), join(dist, '_template.html'))
const template = readFileSync(join(dist, '_template.html'), 'utf8')
const site = createSite(root)
const page = (route) => site.page(template, route, { inline: false }).html

setContent(site.read())
const all = routes()
for (const route of all) {
  const file = route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(route))
}
// Unknown addresses get the app shell with a noindex tag.
writeFileSync(join(dist, '404.html'), page('/404'))

writeFileSync(join(dist, 'sitemap.xml'), sitemapXml(new Date().toISOString().slice(0, 10)))
writeFileSync(join(dist, 'robots.txt'), robotsTxt())
writeFileSync(join(dist, 'llms.txt'), llmsTxt())
writeFileSync(join(dist, 'llms-full.txt'), llmsTxt(true))

console.log(`Prerendered ${all.length} pages, sitemap.xml, robots.txt, llms.txt and llms-full.txt`)
