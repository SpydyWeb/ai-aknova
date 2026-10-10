// The part of the site that runs on the server. There is no database: everything the admin
// panel saves goes into the content folder as plain files.
//
//   content/site.json     every word, list, page and SEO setting
//   content/uploads/      photos and videos added in the admin panel
//   content/backups/      the last 30 saved versions of site.json
//   content/admin.json    the admin email, the password (scrambled) and the sign-in secret. Never served.
//
// `npm run dev` (through vite.config.js) and `npm start` (through server/index.mjs) both use this file.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { StoreError, githubStore } from './github.mjs'
import { setContent } from '../src/data.js'
import { bodyHtml, headTags, llmsTxt, robotsTxt, seoFor, sitemapXml } from '../src/seo.js'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
}
const UPLOADS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.mp4', '.m4v', '.webm', '.mov', '.pdf']
const MAX_UPLOAD = 300 * 1024 * 1024
// Hosts like Vercel refuse any request larger than about 4.5 MB.
const MAX_REMOTE_UPLOAD = 4 * 1024 * 1024
const MAX_JSON = 6 * 1024 * 1024
const KEEP_BACKUPS = 30
const COOKIE = 'aknova_admin'
const WEEK = 7 * 24 * 60 * 60

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}
const fail = (res, status, message) => json(res, status, { error: message })

function readBody(req, limit) {
  // Some hosts (Vercel) read the request before handing it over and leave the result on req.body.
  let given
  try {
    given = req.body
  } catch {
    given = undefined
  }
  if (given !== undefined && given !== null) {
    const buffer = Buffer.isBuffer(given) ? given : Buffer.from(typeof given === 'string' ? given : JSON.stringify(given))
    return buffer.length > limit ? Promise.reject(new Error('too large')) : Promise.resolve(buffer)
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
const readJson = async (req) => JSON.parse((await readBody(req, MAX_JSON)).toString('utf8') || '{}')

// Sends one file, including the byte ranges browsers ask for when they play video.
export function sendFile(req, res, file, cache = 'no-cache') {
  let stat
  try {
    stat = statSync(file)
  } catch {
    return false
  }
  if (!stat.isFile()) return false
  const ext = extname(file).toLowerCase()
  const headers = {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': cache,
    'Accept-Ranges': 'bytes',
    'Last-Modified': stat.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  }
  // An uploaded SVG opened on its own must not be able to run scripts.
  if (ext === '.svg') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1
    if (start > end || start >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` })
      res.end()
      return true
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 })
    if (req.method === 'HEAD') res.end()
    else createReadStream(file, { start, end }).pipe(res)
    return true
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size })
  if (req.method === 'HEAD') res.end()
  else createReadStream(file).pipe(res)
  return true
}

export function createSite(root) {
  const dir = process.env.CONTENT_DIR || join(root, 'content')
  const file = join(dir, 'site.json')
  const adminFile = join(dir, 'admin.json')
  const uploads = join(dir, 'uploads')
  const backups = join(dir, 'backups')
  // With GITHUB_REPO and GITHUB_TOKEN set, saves go to the repository instead of this machine's disk.
  const remote = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO)
  // On Vercel there is no disk to save to, so without those two settings nothing can be stored.
  const stuck = !!process.env.VERCEL && !remote
  if (!remote && !stuck) {
    mkdirSync(uploads, { recursive: true })
    mkdirSync(backups, { recursive: true })
  }

  /* ---------- content ---------- */
  let cache = { time: 0, data: null }
  function read() {
    const time = statSync(file).mtimeMs
    if (time !== cache.time) cache = { time, data: JSON.parse(readFileSync(file, 'utf8')) }
    return cache.data
  }
  function write(data) {
    if (existsSync(file)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      writeFileSync(join(backups, `site-${stamp}.json`), readFileSync(file))
      const old = readdirSync(backups).filter((f) => f.endsWith('.json')).sort()
      old.slice(0, Math.max(0, old.length - KEEP_BACKUPS)).forEach((f) => unlinkSync(join(backups, f)))
    }
    const tmp = `${file}.tmp`
    writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
    renameSync(tmp, file)
  }
  const looksRight = (d) => d && typeof d === 'object' && !Array.isArray(d) && d.site && typeof d.site === 'object' && Array.isArray(d.pages) && d.pages.some((p) => p?.path === '/')

  /* ---------- sign-in ---------- */
  const admin = () => {
    try {
      return JSON.parse(readFileSync(adminFile, 'utf8'))
    } catch {
      return {}
    }
  }
  const saveAdmin = (a) => writeFileSync(adminFile, JSON.stringify(a, null, 2) + '\n')
  const secret = () => {
    const a = admin()
    if (a.secret) return a.secret
    // An account set through the host's settings has no file to keep a secret in.
    if (fromEnv()) return process.env.ADMIN_SECRET || createHmac('sha256', process.env.ADMIN_PASSWORD).update(`aknova-session:${tidy(process.env.ADMIN_EMAIL)}`).digest('hex')
    a.secret = randomBytes(32).toString('hex')
    saveAdmin(a)
    return a.secret
  }
  const scramble = (password, salt) => scryptSync(password, salt, 64).toString('hex')
  const same = (a, b) => {
    const x = Buffer.from(String(a))
    const y = Buffer.from(String(b))
    return x.length === y.length && timingSafeEqual(x, y)
  }
  const tidy = (email) => String(email || '').trim().toLowerCase()
  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200
  // The account is either the one saved in admin.json, or ADMIN_EMAIL and ADMIN_PASSWORD set on the server.
  const fromEnv = () => !admin().hash && !!process.env.ADMIN_PASSWORD && validEmail(tidy(process.env.ADMIN_EMAIL))
  const hasPassword = () => !!admin().hash || fromEnv()
  const adminEmail = () => (admin().hash ? admin().email || '' : fromEnv() ? tidy(process.env.ADMIN_EMAIL) : '')
  function checkPassword(password) {
    const a = admin()
    if (a.hash) return same(scramble(password, a.salt), a.hash)
    return fromEnv() && same(password, process.env.ADMIN_PASSWORD)
  }
  // Both are always checked, so the answer never reveals which of the two was wrong.
  function checkLogin(email, password) {
    const okPassword = checkPassword(password)
    const known = adminEmail()
    // An account made before emails were asked for takes the first email it is signed in with.
    const okEmail = known ? same(tidy(email), known) : validEmail(tidy(email))
    return okPassword && okEmail
  }
  // Changing the password or email also changes the secret, which signs every other device out.
  function setAccount(email, password) {
    const a = admin()
    const next = { ...a, email: tidy(email), secret: randomBytes(32).toString('hex') }
    if (password) {
      next.salt = randomBytes(16).toString('hex')
      next.hash = scramble(password, next.salt)
    }
    saveAdmin(next)
  }
  const sign = (exp) => createHmac('sha256', secret()).update(String(exp)).digest('hex')
  function signedIn(req) {
    const m = new RegExp(`(?:^|; )${COOKIE}=(\\d+)\\.([a-f0-9]+)`).exec(req.headers.cookie || '')
    return !!m && Number(m[1]) > Date.now() / 1000 && same(sign(m[1]), m[2])
  }
  function cookie(req, res, exp) {
    const secure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? '; Secure' : ''
    const value = exp ? `${exp}.${sign(exp)}` : ''
    res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${exp ? WEEK : 0}${secure}`)
  }
  // The first password can only be created from the computer the site runs on.
  const isLocal = (req) => !req.headers['x-forwarded-for'] && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
  const tries = new Map()
  const who = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim()
  function locked(req) {
    const t = tries.get(who(req))
    return !!t && t.count >= 5 && t.until > Date.now()
  }
  function missed(req) {
    const t = tries.get(who(req))
    const fresh = !t || t.until < Date.now()
    tries.set(who(req), { count: fresh ? 1 : t.count + 1, until: Date.now() + 10 * 60 * 1000 })
  }

  /* ---------- uploads ---------- */
  function mediaList() {
    return readdirSync(uploads)
      .filter((f) => UPLOADS.includes(extname(f).toLowerCase()))
      .map((name) => {
        const s = statSync(join(uploads, name))
        return { name, url: `/uploads/${name}`, size: s.size, time: s.mtimeMs, type: (TYPES[extname(name).toLowerCase()] || '').split('/')[0] }
      })
      .sort((a, b) => b.time - a.time)
  }
  function safeName(raw, taken) {
    const ext = extname(raw).toLowerCase()
    if (!UPLOADS.includes(ext)) return null
    const stem = basename(raw, extname(raw)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'file'
    let name = stem + ext
    for (let n = 2; taken.includes(name); n++) name = `${stem}-${n}${ext}`
    return name
  }
  function upload(req, name) {
    return new Promise((resolve, reject) => {
      const tmp = join(uploads, `.${name}.part`)
      const out = createWriteStream(tmp)
      let size = 0
      const stop = (err) => {
        out.destroy()
        try {
          unlinkSync(tmp)
        } catch {
          /* nothing was written */
        }
        reject(err)
      }
      req.on('data', (c) => {
        size += c.length
        if (size > MAX_UPLOAD) {
          req.unpipe(out)
          stop(new Error('too large'))
        }
      })
      req.on('error', stop)
      req.on('aborted', () => stop(new Error('aborted')))
      out.on('error', stop)
      out.on('finish', () => {
        if (!size) return stop(new Error('empty'))
        renameSync(tmp, join(uploads, name))
        resolve()
      })
      req.pipe(out)
    })
  }

  /* ---------- where things are kept: this machine's disk, or the GitHub repository ---------- */
  const local = {
    read: async () => read(),
    write: async (data) => write(data),
    backups: async () =>
      readdirSync(backups)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .reverse()
        .map((name) => ({ name, time: statSync(join(backups, name)).mtimeMs })),
    restore: async (name) => {
      const from = join(backups, basename(String(name)))
      return existsSync(from) ? JSON.parse(readFileSync(from, 'utf8')) : null
    },
    media: async () => mediaList(),
    taken: async () => readdirSync(uploads),
    upload: (name, _buffer, req) => upload(req, name),
    remove: async (name) => {
      if (!existsSync(join(uploads, name))) return false
      unlinkSync(join(uploads, name))
      return true
    },
  }
  const store = remote
    ? githubStore({ token: process.env.GITHUB_TOKEN, repo: process.env.GITHUB_REPO, branch: process.env.GITHUB_BRANCH || 'main', dir: process.env.GITHUB_DIR || '', allowed: UPLOADS, types: TYPES })
    : local
  const maxUpload = remote ? MAX_REMOTE_UPLOAD : MAX_UPLOAD
  const mb = (n) => `${Math.round(n / 1048576)} MB`

  /* ---------- the API the admin panel talks to ---------- */
  async function api(req, res) {
    const url = new URL(req.url, 'http://site')
    const path = url.pathname
    if (!path.startsWith('/api/')) return false
    const is = (method, p) => req.method === method && path === p
    try {
      if (is('GET', '/api/admin/me')) return json(res, 200, { stuck, remote, maxUpload, hasPassword: hasPassword(), needsEmail: hasPassword() && !adminEmail(), canSetup: !hasPassword() && isLocal(req), signedIn: hasPassword() && signedIn(req), email: hasPassword() && signedIn(req) ? adminEmail() : undefined, fixed: fromEnv() }), true

      if (stuck) return fail(res, 503, 'This host has nowhere to save. Add GITHUB_REPO and GITHUB_TOKEN in its settings, then redeploy.'), true
      if (is('GET', '/api/content')) return json(res, 200, await store.read()), true

      // Anything that changes something must come from the admin panel itself, not another website.
      if (req.method !== 'GET' && req.headers['x-admin'] !== '1') return fail(res, 403, 'This request did not come from the admin panel.'), true

      if (is('POST', '/api/admin/setup')) {
        if (hasPassword()) return fail(res, 409, 'An admin account already exists. Sign in instead.'), true
        if (!isLocal(req)) return fail(res, 403, 'Create the admin account on the computer the site runs on, or set ADMIN_EMAIL and ADMIN_PASSWORD on the server.'), true
        const { email, password } = await readJson(req)
        if (!validEmail(tidy(email))) return fail(res, 400, 'Enter a real email address.'), true
        if (typeof password !== 'string' || password.length < 8) return fail(res, 400, 'Use at least 8 characters for the password.'), true
        setAccount(email, password)
        cookie(req, res, Math.floor(Date.now() / 1000) + WEEK)
        return json(res, 200, { ok: true }), true
      }
      if (is('POST', '/api/admin/login')) {
        if (locked(req)) return fail(res, 429, 'Too many wrong attempts. Wait ten minutes and try again.'), true
        const { email, password } = await readJson(req)
        if (typeof password !== 'string' || typeof email !== 'string' || !checkLogin(email, password)) {
          missed(req)
          await new Promise((r) => setTimeout(r, 600))
          return fail(res, 401, 'The email or password is not right.'), true
        }
        if (!adminEmail() && !fromEnv()) saveAdmin({ ...admin(), email: tidy(email) })
        tries.delete(who(req))
        cookie(req, res, Math.floor(Date.now() / 1000) + WEEK)
        return json(res, 200, { ok: true }), true
      }
      if (is('POST', '/api/admin/logout')) {
        cookie(req, res, 0)
        return json(res, 200, { ok: true }), true
      }

      if (!hasPassword() || !signedIn(req)) return fail(res, 401, 'Sign in to the admin panel first.'), true

      if (is('POST', '/api/admin/account')) {
        if (fromEnv()) return fail(res, 409, 'This account is set on the server with ADMIN_EMAIL and ADMIN_PASSWORD. Change it there.'), true
        if (locked(req)) return fail(res, 429, 'Too many wrong attempts. Wait ten minutes and try again.'), true
        const { current, email, next } = await readJson(req)
        if (typeof current !== 'string' || !checkPassword(current)) {
          missed(req)
          return fail(res, 401, 'The current password is not right.'), true
        }
        if (!validEmail(tidy(email))) return fail(res, 400, 'Enter a real email address.'), true
        if (next && (typeof next !== 'string' || next.length < 8)) return fail(res, 400, 'Use at least 8 characters for the new password.'), true
        setAccount(email, next || '')
        cookie(req, res, Math.floor(Date.now() / 1000) + WEEK)
        return json(res, 200, { ok: true, email: tidy(email) }), true
      }

      if (is('PUT', '/api/content')) {
        const data = await readJson(req)
        if (!looksRight(data)) return fail(res, 400, 'That does not look like the site content, so nothing was saved.'), true
        await store.write(data)
        return json(res, 200, { ok: true }), true
      }
      if (is('GET', '/api/backups')) return json(res, 200, await store.backups()), true
      if (is('POST', '/api/backups/restore')) {
        const { name } = await readJson(req)
        const data = await store.restore(name)
        if (!data) return fail(res, 404, 'That saved version no longer exists.'), true
        if (!looksRight(data)) return fail(res, 400, 'That saved version is damaged.'), true
        await store.write(data, 'Restore an earlier version from the admin panel')
        return json(res, 200, data), true
      }

      if (is('GET', '/api/media')) return json(res, 200, await store.media()), true
      if (is('POST', '/api/media')) {
        const name = safeName(url.searchParams.get('name') || '', await store.taken())
        if (!name) return fail(res, 400, `That kind of file cannot be uploaded. Use ${UPLOADS.join(', ')}.`), true
        try {
          await store.upload(name, remote ? await readBody(req, maxUpload) : null, req)
        } catch (e) {
          if (e instanceof StoreError) throw e
          return fail(res, e.message === 'too large' ? 413 : 400, e.message === 'too large' ? `That file is larger than ${mb(maxUpload)}.` : 'The upload did not finish. Try again.'), true
        }
        const all = await store.media()
        return json(res, 200, all.find((m) => m.name === name) || { name, url: `/uploads/${name}`, size: 0, time: Date.now(), type: (TYPES[extname(name)] || '').split('/')[0] }), true
      }
      if (is('DELETE', '/api/media')) {
        const name = basename(url.searchParams.get('name') || '')
        if (!name || !(await store.remove(name))) return fail(res, 404, 'That file is not in the library.'), true
        return json(res, 200, { ok: true }), true
      }
      return fail(res, 404, 'Not found.'), true
    } catch (e) {
      if (e instanceof StoreError) return fail(res, 502, e.message), true
      const big = e.message === 'too large'
      return fail(res, big ? 413 : e instanceof SyntaxError ? 400 : 500, big ? 'That is too much to save at once.' : e instanceof SyntaxError ? 'The request could not be read.' : 'Something went wrong on the server.'), true
    }
  }

  /* ---------- uploaded files, and the files search engines and AI assistants ask for ---------- */
  function files(req, res) {
    const path = decodeURIComponent(new URL(req.url, 'http://site').pathname)
    if (req.method !== 'GET' && req.method !== 'HEAD') return false
    if (path.startsWith('/uploads/')) {
      const name = basename(path)
      if (name.startsWith('.') || !sendFile(req, res, join(uploads, name), 'public, max-age=3600')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
      }
      return true
    }
    const made = {
      '/sitemap.xml': () => sitemapXml(new Date().toISOString().slice(0, 10)),
      '/robots.txt': robotsTxt,
      '/llms.txt': () => llmsTxt(),
      '/llms-full.txt': () => llmsTxt(true),
    }[path]
    if (!made) return false
    setContent(read())
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)], 'Cache-Control': 'no-cache' })
    res.end(made())
    return true
  }

  /* ---------- a full page: its own title, description, structured data and readable text ---------- */
  // The stylesheet for the site (or the admin panel) goes in the page itself, so the browser has
  // it before it draws anything. Otherwise it would only arrive after the script that asks for it.
  let sheets = null
  function sheet(name) {
    if (!sheets) {
      try {
        sheets = readdirSync(join(root, 'dist', 'assets')).filter((f) => f.endsWith('.css'))
      } catch {
        sheets = []
      }
    }
    const found = sheets.find((f) => f.startsWith(`${name}-`))
    return found ? `<link rel="stylesheet" crossorigin href="/assets/${found}" />\n    ` : ''
  }

  function page(template, route, { inline = true } = {}) {
    const data = read()
    setContent(data)
    const isAdmin = route.replace(/\/+$/, '') === '/admin'
    const boot = inline ? `\n    <script>window.__CONTENT__=${JSON.stringify(data).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '')}</script>` : ''
    const html = template
      .replace(/<title>[\s\S]*?<\/title>\s*/, '')
      .replace(/<meta name="description"[^>]*>\s*/, '')
      .replace('</head>', () => `  ${sheet(isAdmin ? 'Admin' : 'App')}${isAdmin ? '<title>Admin panel</title>\n    <meta name="robots" content="noindex, nofollow" />' : headTags(route)}${boot}\n  </head>`)
      .replace('<div id="root"></div>', () => `<div id="root">${isAdmin ? '' : bodyHtml(route)}</div>`)
    return { html, missing: !!seoFor(route).missing && !isAdmin }
  }

  // On a host with no disk, a file uploaded since the last rebuild is fetched from the repository.
  async function remoteFile(req, res) {
    const path = decodeURIComponent(new URL(req.url, 'http://site').pathname)
    if (!remote || !path.startsWith('/uploads/') || (req.method !== 'GET' && req.method !== 'HEAD')) return false
    const name = basename(path)
    const ext = extname(name).toLowerCase()
    let buffer = null
    try {
      if (UPLOADS.includes(ext)) buffer = await store.file(name)
    } catch {
      buffer = null
    }
    if (!buffer) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return true
    }
    const headers = { 'Content-Type': TYPES[ext], 'Content-Length': buffer.length, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' }
    if (ext === '.svg') headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    res.writeHead(200, headers)
    res.end(req.method === 'HEAD' ? undefined : buffer)
    return true
  }

  return { api, files, remoteFile, page, read, dir }
}
