// Everything search engines and AI assistants read about the site is made here: page titles,
// descriptions, structured data, the plain-HTML version of each page, sitemap, robots and llms.txt.
// It all comes from the content the admin panel edits. The browser uses it on every page change,
// the server uses it for every page it sends, and scripts/prerender.mjs uses it at build time.
import { CONTACT, EMAIL, FAQS, PAGES, PLANS, POSTS, PROJECTS, REASONS, SEO_SETTINGS, SERVICE_INFO, SITE_INFO, STEPS, TAGLINE, VOICES, mediaUrl, slug } from './data.js'
import { embedUrl, isVideo, paragraphs } from './blocks.js'

export { slug }

const serviceUrl = (s) => `/services/${slug(s.name)}`
const abs = (path) => (/^https?:\/\//.test(path) ? path : SITE_INFO.url + (path === '/' ? '/' : path))
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const names = () => SERVICE_INFO.map((s) => s.name)
const sentence = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0] || '')
const clean = (pathname) => pathname.replace(/\/+$/, '') || '/'
const has = (page, type) => page.blocks.some((b) => b.type === type)
const where = () => (SITE_INFO.city ? ` in ${SITE_INFO.city}` : '')

// One or two sentences that say what the company is. Written in the admin panel, or built from the services.
export const summary = () =>
  SEO_SETTINGS.ai.summary?.trim() ||
  `${SITE_INFO.name} is a ${SITE_INFO.city ? `${SITE_INFO.city}-based ` : ''}technology company that designs, builds and markets digital products: ${sentence(names())}.`

export const routes = () => [...PAGES.map((p) => p.path), ...SERVICE_INFO.map(serviceUrl), ...POSTS.map((p) => `/blog/${p.id}`)]

/* ---------- structured data ---------- */
const orgId = () => `${SITE_INFO.url}/#organization`
function organization() {
  const s = SEO_SETTINGS
  return {
    '@type': 'ProfessionalService',
    '@id': orgId(),
    name: SITE_INFO.name,
    url: SITE_INFO.url,
    slogan: TAGLINE || undefined,
    description: summary(),
    logo: `${SITE_INFO.url}/logo.png`,
    image: abs(mediaUrl(s.image) || '/og.png'),
    email: EMAIL || undefined,
    telephone: CONTACT.tel || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_INFO.street || CONTACT.address,
      addressLocality: SITE_INFO.locality || SITE_INFO.city,
      postalCode: SITE_INFO.postcode || undefined,
      addressCountry: SITE_INFO.country || undefined,
    },
    areaServed: s.areaServed || undefined,
    foundingDate: s.founded || undefined,
    priceRange: s.priceRange || undefined,
    openingHours: s.hours || undefined,
    sameAs: SITE_INFO.social.length ? SITE_INFO.social.map((x) => x.url) : undefined,
    knowsAbout: names(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: SERVICE_INFO.map((x) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: x.name, description: x.line, url: abs(serviceUrl(x)) },
      })),
    },
  }
}
const website = () => ({ '@type': 'WebSite', '@id': `${SITE_INFO.url}/#website`, url: SITE_INFO.url, name: SITE_INFO.name, publisher: { '@id': orgId() }, inLanguage: 'en' })
const faqPage = () => ({
  '@type': 'FAQPage',
  mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})
const crumbs = (...items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...items].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

// What a page says about itself when no title or description has been typed in the admin panel.
const AUTO = {
  '/': () => [`${SITE_INFO.name} | Websites, apps, marketing and software${where()}`, `${summary()} One team from first idea to launch and after.`],
  '/services': () => [`Services: web, apps, SEO, marketing, AI and business software | ${SITE_INFO.name}`, `${SERVICE_INFO.length} services from one team${where()}: ${names().join(', ')}. Pick one or combine several.`],
  '/work': () => [`Our work | ${SITE_INFO.name}`, `Websites, apps, marketing campaigns and business software built by ${SITE_INFO.name}.`],
  '/pricing': () => [`Pricing and plans | ${SITE_INFO.name}`, `Starting plans for websites, marketing and business software, as a one-time project or monthly care. Every plan is shaped to fit.`],
  '/blog': () => [`Blog: plain advice on websites, marketing and software | ${SITE_INFO.name}`, `Short, jargon-free articles for business owners on websites, SEO, CRM and automation.`],
  '/about': () => [`About ${SITE_INFO.name} | One team for design, development and marketing`, `${summary()} The people who design your screens sit next to the people who build and market them.`],
  '/contact': () => [`Contact ${SITE_INFO.name} | Start a project${where()}`, `Call ${CONTACT.phone}, email ${EMAIL}, or send the form. Office: ${CONTACT.address}.`],
}

// The first words on a page, used as its description when nothing better exists.
function firstWords(page) {
  for (const b of page.blocks) {
    const t = b.text || paragraphs(b.body)[0]
    if (t) return t
  }
  return summary()
}

/* ---------- per-page title, description and data ---------- */
export function seoFor(pathname) {
  const path = clean(pathname)
  const service = SERVICE_INFO.find((s) => serviceUrl(s) === path)
  const post = POSTS.find((p) => `/blog/${p.id}` === path)
  const page = PAGES.find((p) => p.path === path)
  const org = organization()
  let own = {}
  let title
  let description
  let image = ''
  let data = []

  if (service) {
    own = service.seo
    title = `${service.name}${where()} | ${SITE_INFO.name}`
    description = `${service.line} Includes ${service.items.join(', ')}. Talk to ${SITE_INFO.name}${where()}.`
    data = [
      { '@type': 'Service', name: service.name, serviceType: service.name, description: service.line, url: abs(path), provider: { '@id': orgId() }, areaServed: SEO_SETTINGS.areaServed || undefined },
      org,
      crumbs(['Services', '/services'], [service.name, path]),
    ]
  } else if (post) {
    own = post.seo
    image = post.cover
    title = `${post.title} | ${SITE_INFO.name}`
    description = post.intro
    data = [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.intro,
        articleSection: post.topic || undefined,
        articleBody: post.body.map((s) => `${s.heading}. ${s.text}`).join(' '),
        url: abs(path),
        mainEntityOfPage: abs(path),
        image: abs(mediaUrl(post.cover || SEO_SETTINGS.image) || '/og.png'),
        datePublished: post.date || undefined,
        author: { '@id': orgId() },
        publisher: { '@id': orgId() },
        inLanguage: 'en',
      },
      org,
      crumbs(['Blog', '/blog'], [post.title, path]),
    ]
  } else if (page) {
    own = page.seo
    ;[title, description] = AUTO[path]?.() || [`${page.title} | ${SITE_INFO.name}`, firstWords(page)]
    if (path === '/') data.push(website())
    if (path === '/about') data.push({ '@type': 'AboutPage', url: abs(path), about: { '@id': orgId() } })
    if (has(page, 'contact')) data.push({ '@type': 'ContactPage', url: abs(path), about: { '@id': orgId() } })
    if (has(page, 'blogGrid'))
      data.push({ '@type': 'Blog', name: `${SITE_INFO.name} blog`, url: abs(path), publisher: { '@id': orgId() }, blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(`/blog/${p.id}`) })) })
    if (has(page, 'faq') && FAQS.length) data.push(faqPage())
    data.push(org)
    if (path !== '/') data.push(crumbs([page.title, path]))
  } else {
    return { path, title: `Page not found | ${SITE_INFO.name}`, description: 'This page does not exist.', url: abs('/'), image: abs('/og.png'), jsonld: null, missing: true, noindex: true }
  }

  return {
    path,
    title: own.title?.trim() || title,
    description: own.description?.trim() || description,
    auto: { title, description },
    url: abs(path),
    image: abs(mediaUrl(own.image || image || SEO_SETTINGS.image) || '/og.png'),
    noindex: !!own.noindex || SEO_SETTINGS.indexing === false,
    article: !!post,
    jsonld: { '@context': 'https://schema.org', '@graph': data },
  }
}

export const robotsMeta = (m) => (m.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1')

/* ---------- <head> tags, as text ---------- */
export function headTags(pathname) {
  const m = seoFor(pathname)
  const s = SEO_SETTINGS
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    s.keywords ? `<meta name="keywords" content="${esc(s.keywords)}" />` : '',
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<meta name="robots" content="${robotsMeta(m)}" />`,
    s.googleVerification ? `<meta name="google-site-verification" content="${esc(s.googleVerification)}" />` : '',
    s.bingVerification ? `<meta name="msvalidate.01" content="${esc(s.bingVerification)}" />` : '',
    `<meta property="og:type" content="${m.article ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${esc(SITE_INFO.name)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(m.url)}" />`,
    `<meta property="og:image" content="${esc(m.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
    `<link rel="alternate" type="text/plain" href="${SITE_INFO.url}/llms.txt" title="Summary for AI assistants" />`,
    m.jsonld ? `<script type="application/ld+json" id="ld">${JSON.stringify(m.jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

/* ---------- plain HTML for each page ----------
   Crawlers and AI tools that do not run JavaScript read this. It carries the same words the
   live page shows, and the app replaces it the moment it starts. */
const ul = (items) => (items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '')
const link = (path, text) => `<a href="${esc(path)}">${esc(text)}</a>`
const h2 = (t) => (t ? `<h2>${esc(t)}</h2>` : '')
const p = (t) => (t ? `<p>${esc(t)}</p>` : '')
const img = (src, alt) => (src ? `<img src="${esc(mediaUrl(src))}" alt="${esc(alt)}" loading="lazy" />` : '')
const servicesHtml = () => ul(SERVICE_INFO.map((s) => `${link(serviceUrl(s), s.name)}: ${esc(s.line)}`))
const stepsHtml = () => `<ol>${STEPS.map(([n, t]) => `<li><strong>${esc(n)}.</strong> ${esc(t)}</li>`).join('')}</ol>`
const plansHtml = () => ul(PLANS.map((x) => `<strong>${esc(x.name)}.</strong> ${esc(x.line)} ${esc(x.items.join(', '))}.`))
const postsHtml = (posts) => ul(posts.map((x) => `${link(`/blog/${x.id}`, x.title)}: ${esc(x.intro)}`))
const projectsHtml = () => ul(PROJECTS.map((x) => `<strong>${esc(x.name)}</strong> (${esc(x.type)}). ${esc(x.blurb)}${x.link ? ` ${link(x.link, 'Visit the project')}` : ''}`))
const contactHtml = () =>
  `<p>Phone: <a href="tel:${esc(CONTACT.tel)}">${esc(CONTACT.phone)}</a>. Email: <a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a>. Office: ${esc(CONTACT.address)}.</p>`

const BLOCK_HTML = {
  hero: (b) => `<h1>${esc([b.before, sentence((b.words || []).map((w) => w.text)), b.after].filter(Boolean).join(' '))}</h1>${p(b.text)}`,
  pageHero: (b) => `<h1>${esc(b.title)}</h1>${p(b.text)}`,
  text: (b) => h2(b.title) + paragraphs(b.body).map(p).join(''),
  split: (b) => h2(b.title) + paragraphs(b.body).map(p).join('') + (isVideo(b.media) ? '' : img(b.media, b.alt)) + (b.buttonLabel && b.buttonTo ? `<p>${link(b.buttonTo, b.buttonLabel)}</p>` : ''),
  image: (b) => (b.src ? `<figure>${img(b.src, b.alt)}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>` : ''),
  gallery: (b) => h2(b.title) + (b.images || []).map((i) => img(i.src, i.alt)).join(''),
  video: (b) => h2(b.title) + (embedUrl(b.embed) ? `<p>${link(b.embed, b.caption || b.title || 'Watch the video')}</p>` : p(b.caption)),
  cards: (b) => h2(b.title) + p(b.text) + ul((b.cards || []).map((c) => `<strong>${esc(c.title)}.</strong> ${esc(c.text)}`)),
  cta: (b) => h2(b.title) + p(b.text) + (b.buttonLabel && b.buttonTo ? `<p>${link(b.buttonTo, b.buttonLabel)}</p>` : ''),
  services: (b) => h2(b.title) + servicesHtml(),
  serviceGrid: () => servicesHtml(),
  work: (b) => h2(b.title) + projectsHtml(),
  workGrid: () => projectsHtml(),
  story: (b) => h2(b.title) + stepsHtml(),
  process: (b) => h2(b.title) + stepsHtml(),
  why: (b) => h2(b.title) + ul(REASONS.map(([t, d]) => `<strong>${esc(t)}.</strong> ${esc(d)}`)),
  pricing: (b) => h2(b.title) + p(b.text) + plansHtml(),
  voices: (b) => h2(b.title) + VOICES.map((v) => `<blockquote><p>${esc(v.quote)}</p><cite>${esc(v.who)}</cite></blockquote>`).join(''),
  blog: (b) => h2(b.title) + postsHtml(POSTS.slice(0, 3)),
  blogGrid: () => postsHtml(POSTS),
  faq: (b) => h2(b.title) + `<dl>${FAQS.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl>`,
  contact: (b) => `<h1>${esc(b.title)}</h1>${contactHtml()}`,
}

export const navPages = () => PAGES.filter((x) => x.inNav)

export function bodyHtml(pathname) {
  const path = clean(pathname)
  const service = SERVICE_INFO.find((s) => serviceUrl(s) === path)
  const post = POSTS.find((x) => `/blog/${x.id}` === path)
  const page = PAGES.find((x) => x.path === path)
  let main = ''

  if (service) {
    main = `<p>${link('/services', 'All services')}</p><h1>${esc(service.name)}</h1>${p(service.line)}
<h2>What you get</h2>${ul(service.items.map(esc))}<h2>How it runs</h2>${stepsHtml()}<p>${link('/contact', 'Start a project')}</p>`
  } else if (post) {
    main = `<article><p>${link('/blog', 'All articles')}</p><h1>${esc(post.title)}</h1>${img(post.cover, post.title)}${p(post.intro)}
${post.body.map((s) => `${h2(s.heading)}${paragraphs(s.text).map(p).join('')}`).join('')}</article>`
  } else if (page) {
    main = page.blocks.map((b) => BLOCK_HTML[b.type]?.(b) || '').join('\n')
    if (!/<h1/.test(main)) main = `<h1>${esc(page.title)}</h1>${main}`
  } else {
    main = `<h1>${esc(SITE_INFO.notFound.title || 'This page is not here')}</h1><p>${link('/', 'Go to the home page')}</p>`
  }

  return `<div class="prerender">
<nav>${[link('/', 'Home'), ...navPages().map((x) => link(x.path, x.title))].join(' | ')}</nav>
<main>${main}</main>
<footer><p>${esc(SITE_INFO.name)}. ${esc(TAGLINE)}</p>${contactHtml()}</footer>
</div>`
}

/* ---------- sitemap, robots and llms.txt ---------- */
export function sitemapXml(date) {
  const rows = routes()
    .filter((r) => !seoFor(r).noindex)
    .map((r) => `  <url><loc>${esc(abs(r))}</loc><lastmod>${date}</lastmod><priority>${r === '/' ? '1.0' : r.split('/').length > 2 ? '0.7' : '0.8'}</priority></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`
}

// Bots that fetch pages to answer a person's question, and bots that collect pages to train models.
export const ANSWER_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User']
export const TRAINING_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent']

export function robotsTxt() {
  if (SEO_SETTINGS.indexing === false) return `# This site is hidden from search engines. Switch that off in the admin panel under SEO.\nUser-agent: *\nDisallow: /\n`
  const { answers, training } = SEO_SETTINGS.ai
  const group = (bots, allow) => bots.map((b) => `User-agent: ${b}`).join('\n') + `\n${allow ? 'Allow: /\nDisallow: /admin\nDisallow: /api/' : 'Disallow: /'}`
  return `# Search engines may read this site. The admin panel is private.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# AI assistants answering a person's question
${group(ANSWER_BOTS, answers !== false)}

# AI companies collecting pages to train models
${group(TRAINING_BOTS, training !== false)}

Sitemap: ${SITE_INFO.url}/sitemap.xml
`
}

const blockText = (b) =>
  [b.title && `### ${b.title}`, b.text, ...paragraphs(b.body), ...(b.cards || []).map((c) => `- ${c.title}: ${c.text}`)].filter(Boolean).join('\n\n')

// A short guide for AI assistants (the llms.txt convention): who we are, and where the facts live.
export function llmsTxt(full = false) {
  const facts = SEO_SETTINGS.ai.facts
  const head = `# ${SITE_INFO.name}

> ${summary()}${TAGLINE ? ` ${TAGLINE}` : ''}

- Location: ${CONTACT.address}
- Phone: ${CONTACT.phone}
- Email: ${EMAIL}
- Website: ${SITE_INFO.url}
${SITE_INFO.social.map((s) => `- ${s.label || 'Profile'}: ${s.url}`).join('\n')}
${facts.length ? `\n## Key facts\n\n${facts.map((f) => `- ${f}`).join('\n')}\n` : ''}`
  const services = `## Services\n\n${SERVICE_INFO.map((s) => `- [${s.name}](${abs(serviceUrl(s))}): ${s.line}${s.items.length ? ` Includes ${s.items.join(', ')}.` : ''}`).join('\n')}\n`
  const listed = PAGES.filter((x) => x.path !== '/' && !seoFor(x.path).noindex)
  const pages = `## Pages\n\n${listed.map((x) => `- [${x.title}](${abs(x.path)}): ${seoFor(x.path).description}`).join('\n')}\n`
  const blog = POSTS.length ? `## Articles\n\n${POSTS.map((x) => `- [${x.title}](${abs(`/blog/${x.id}`)}): ${x.intro}`).join('\n')}\n` : ''
  if (!full) return [head, services, pages, blog].join('\n')

  const process = `## How a project runs\n\n${STEPS.map(([n, t], i) => `${i + 1}. ${n}: ${t}`).join('\n')}\n`
  const plans = PLANS.length ? `## Plans\n\n${PLANS.map((x) => `- ${x.name}: ${x.line} ${x.items.join(', ')}.`).join('\n')}\n` : ''
  const faq = `## Frequently asked questions\n\n${FAQS.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}\n`
  const written = listed
    .map((x) => [x, x.blocks.filter((b) => ['text', 'split', 'cards', 'cta'].includes(b.type)).map(blockText).filter(Boolean)])
    .filter(([, t]) => t.length)
    .map(([x, t]) => `## ${x.title}\n\n${t.join('\n\n')}`)
    .join('\n\n')
  const articles = POSTS.map((x) => `## ${x.title}\n\n${x.intro}\n\n${x.body.map((s) => `### ${s.heading}\n\n${s.text}`).join('\n\n')}`).join('\n\n')
  return [head, services, process, plans, faq, written, articles, ''].filter((s) => s !== '').join('\n') + '\n'
}
