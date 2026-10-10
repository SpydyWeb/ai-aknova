// The admin panel's server when the site is hosted on Vercel. vercel.json sends every /api/...
// and /uploads/... request here with the original path in the __path query value.
import { createSite } from '../server/core.mjs'

const site = createSite(process.cwd())

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://site')
  const path = url.searchParams.get('__path')
  if (path !== null) {
    url.searchParams.delete('__path')
    req.url = `${path.startsWith('uploads/') ? '/' : '/api/'}${path}${url.search}`
  }
  try {
    if (await site.api(req, res)) return
    if (await site.remoteFile(req, res)) return
  } catch (e) {
    console.error(e)
  }
  if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ error: 'Not found.' }))
}
