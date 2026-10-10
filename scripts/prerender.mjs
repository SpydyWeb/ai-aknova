// Runs after `vite build`. Writes one real HTML file per page, each with its own title,
// description, structured data and readable content, plus sitemap.xml, robots.txt and llms.txt.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES, bodyHtml, headTags, llmsTxt, robotsTxt, sitemapXml } from '../src/seo.js'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')

function page(route) {
  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `  ${headTags(route)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml(route)}</div>`)
}

for (const route of ROUTES) {
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

console.log(`Prerendered ${ROUTES.length} pages, sitemap.xml, robots.txt, llms.txt and llms-full.txt`)
