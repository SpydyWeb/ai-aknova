// All words, lists, pages and media on the site come from content/site.json, which the admin
// panel edits. This file hands that content to the components. `setContent` must run before
// anything renders (see main.jsx); the server and the prerender script call it too.

export const C = {
  paper: '#F3F6FF',
  ink: '#0B0E14',
  blue: '#1463FF',
  sun: '#FFC933',
  navy: '#0A1F5C',
  sky: '#9CCBFF',
}

// 3D models use a stronger version of the brand palette so they stay vivid under studio lighting.
export const TOY = { ...C, blue: '#0F5BFF', sun: '#FFB800', navy: '#1230A8', sky: '#1FA5FF', paper: '#FFFFFF' }

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// An uploaded file is stored as /uploads/name. A bare file name means the old public/videos folder.
export const mediaUrl = (f) => (!f ? '' : /^(https?:)?\/\//.test(f) || f.startsWith('/') ? f : `/videos/${f}`)

export let CONTENT = {}
export let SITE_INFO = { name: '', tagline: '', url: '', city: '' }
export let EMAIL = ''
export let TAGLINE = ''
export let CONTACT = { phone: '', tel: '', site: '', address: '' }
export let SEO_SETTINGS = { ai: {} }
export let PAGES = []
export let SERVICE_INFO = []
export let SERVICES = []
export let PROJECTS = []
export let STEPS = []
export let REASONS = []
export let VOICES = []
export let FAQS = []
export let PLANS = []
export let POSTS = []

const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [])
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : [])

export function setContent(json) {
  const j = json && typeof json === 'object' ? json : {}
  const site = j.site || {}
  CONTENT = j
  SITE_INFO = {
    name: 'Aknova Tech',
    city: '',
    ...site,
    url: String(site.url || '').replace(/\/+$/, ''),
    social: list(site.social).filter((s) => s.url),
    closing: site.closing || {},
    notFound: site.notFound || {},
    buddyTips: list(site.buddyTips).filter((t) => t.text && t.to),
  }
  EMAIL = site.email || ''
  TAGLINE = site.tagline || ''
  CONTACT = {
    phone: site.phone || '',
    tel: String(site.phone || '').replace(/[^\d+]/g, ''),
    site: SITE_INFO.url.replace(/^https?:\/\//, ''),
    address: site.address || '',
  }
  SEO_SETTINGS = { indexing: true, image: '/og.png', ...j.seo, ai: { answers: true, training: true, ...j.seo?.ai, facts: strings(j.seo?.ai?.facts) } }
  PAGES = list(j.pages)
    .filter((p) => typeof p.path === 'string' && p.path.startsWith('/'))
    .map((p) => ({ ...p, seo: p.seo || {}, blocks: list(p.blocks).filter((b) => b.type) }))
  SERVICE_INFO = list(j.services)
    .filter((s) => s.name)
    .map((s) => ({ line: '', ...s, items: strings(s.items), seo: s.seo || {} }))
  SERVICES = SERVICE_INFO.map((s) => s.name)
  PROJECTS = list(j.projects).filter((p) => p.name)
  STEPS = list(j.steps).map((s) => [s.name || '', s.text || ''])
  REASONS = list(j.reasons).map((r) => [r.title || '', r.text || '', r.tone || 'sun', r.video || ''])
  VOICES = list(j.voices).map((v, id) => ({ ...v, id }))
  FAQS = list(j.faqs)
    .filter((f) => f.q)
    .map((f) => [f.q, f.a || ''])
  PLANS = list(j.plans).map((p) => ({ ...p, items: strings(p.items), services: strings(p.services).filter((s) => SERVICES.includes(s)) }))
  POSTS = list(j.posts)
    .filter((p) => p.title)
    .map((p) => ({ tone: 'blue', topic: '', intro: '', ...p, id: p.id || slug(p.title), body: list(p.body), seo: p.seo || {} }))
}

export const findPage = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/'
  return PAGES.find((p) => p.path === path)
}
