// Everything search engines and AI assistants read about the site lives here: page titles,
// descriptions, structured data, the plain-HTML version of each page, sitemap and llms.txt.
// The browser uses it on every page change; scripts/prerender.mjs uses it at build time.
import { CONTACT, EMAIL, FAQS, PLANS, POSTS, REASONS, SERVICE_INFO, STEPS, TAGLINE } from './data.js'

// Change this if the site goes live on a different address.
export const SITE = { name: 'Aknova Tech', url: 'https://www.aknovatech.com', city: 'Delhi', locale: 'en_IN' }

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const serviceUrl = (s) => `/services/${slug(s.name)}`
const abs = (path) => SITE.url + (path === '/' ? '/' : path)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const serviceNames = SERVICE_INFO.map((s) => s.name)
const SUMMARY = `${SITE.name} is a ${SITE.city}-based technology company that designs, builds and markets digital products: ${serviceNames.slice(0, -1).join(', ')} and ${serviceNames.at(-1)}.`

export const ROUTES = [
  '/',
  '/services',
  ...SERVICE_INFO.map(serviceUrl),
  '/work',
  '/pricing',
  '/blog',
  ...POSTS.map((p) => `/blog/${p.id}`),
  '/about',
  '/contact',
]

/* ---------- structured data ---------- */
const ORG_ID = `${SITE.url}/#organization`
const organization = {
  '@type': 'ProfessionalService',
  '@id': ORG_ID,
  name: SITE.name,
  url: SITE.url,
  slogan: TAGLINE,
  description: SUMMARY,
  logo: `${SITE.url}/logo.png`,
  image: `${SITE.url}/og.png`,
  email: EMAIL,
  telephone: CONTACT.tel,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'E-110, First Floor, Jeewan Park, Uttam Nagar East, Opp Hotel Plazzo Inn',
    addressLocality: 'Delhi',
    postalCode: '110059',
    addressCountry: 'IN',
  },
  areaServed: { '@type': 'Country', name: 'India' },
  knowsAbout: SERVICE_INFO.map((s) => s.name),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Services',
    itemListElement: SERVICE_INFO.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, description: s.line, url: abs(serviceUrl(s)) },
    })),
  },
}
const website = { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: SITE.url, name: SITE.name, publisher: { '@id': ORG_ID }, inLanguage: 'en' }
const faqPage = {
  '@type': 'FAQPage',
  mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
}
const crumbs = (...items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...items].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

/* ---------- per-page title, description and data ---------- */
export function seoFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const service = SERVICE_INFO.find((s) => serviceUrl(s) === path)
  const post = POSTS.find((p) => `/blog/${p.id}` === path)
  let title
  let description
  let data = []

  if (path === '/') {
    title = `${SITE.name} | Websites, apps, marketing and software in ${SITE.city}`
    description = `${SUMMARY} One team from first idea to launch and after.`
    data = [organization, website, faqPage]
  } else if (path === '/services') {
    title = `Services: web, apps, SEO, marketing, AI, CRM, HRM and POS | ${SITE.name}`
    description = `Ten services from one ${SITE.city} team: ${serviceNames.join(', ')}. Pick one or combine several.`
    data = [organization, crumbs(['Services', path])]
  } else if (service) {
    title = `${service.name} in ${SITE.city} | ${SITE.name}`
    description = `${service.line} Includes ${service.items.join(', ')}. Talk to ${SITE.name} in ${SITE.city}.`
    data = [
      { '@type': 'Service', name: service.name, serviceType: service.name, description: service.line, url: abs(path), provider: { '@id': ORG_ID }, areaServed: { '@type': 'Country', name: 'India' } },
      organization,
      crumbs(['Services', '/services'], [service.name, path]),
    ]
  } else if (path === '/work') {
    title = `Our work | ${SITE.name}`
    description = `Websites, apps, marketing campaigns and business software built by ${SITE.name}.`
    data = [organization, crumbs(['Work', path])]
  } else if (path === '/pricing') {
    title = `Pricing and plans | ${SITE.name}`
    description = `Three starting plans for websites, marketing and business software, as a one-time project or monthly care. Every plan is shaped to fit.`
    data = [organization, faqPage, crumbs(['Pricing', path])]
  } else if (path === '/blog') {
    title = `Blog: plain advice on websites, marketing and software | ${SITE.name}`
    description = `Short, jargon-free articles for business owners on websites, SEO, CRM and automation.`
    data = [
      { '@type': 'Blog', name: `${SITE.name} blog`, url: abs(path), publisher: { '@id': ORG_ID }, blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(`/blog/${p.id}`) })) },
      organization,
      crumbs(['Blog', path]),
    ]
  } else if (post) {
    title = `${post.title} | ${SITE.name}`
    description = post.intro
    data = [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.intro,
        articleSection: post.topic,
        articleBody: post.body.map(([h, t]) => `${h}. ${t}`).join(' '),
        url: abs(path),
        mainEntityOfPage: abs(path),
        image: `${SITE.url}/og.png`,
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
      },
      organization,
      crumbs(['Blog', '/blog'], [post.title, path]),
    ]
  } else if (path === '/about') {
    title = `About ${SITE.name} | One team for design, development and marketing`
    description = `${SUMMARY} The people who design your screens sit next to the people who build and market them.`
    data = [{ '@type': 'AboutPage', url: abs(path), about: { '@id': ORG_ID } }, organization, crumbs(['About', path])]
  } else if (path === '/contact') {
    title = `Contact ${SITE.name} | Start a project in ${SITE.city}`
    description = `Call ${CONTACT.phone}, email ${EMAIL}, or send the form. Office: ${CONTACT.address}.`
    data = [{ '@type': 'ContactPage', url: abs(path), about: { '@id': ORG_ID } }, organization, faqPage, crumbs(['Contact', path])]
  } else {
    return { path, title: `Page not found | ${SITE.name}`, description: 'This page does not exist.', url: abs('/'), jsonld: null, missing: true }
  }

  return { path, title, description, url: abs(path), jsonld: { '@context': 'https://schema.org', '@graph': data } }
}

/* ---------- <head> tags, as text for prerendering ---------- */
export function headTags(pathname) {
  const m = seoFor(pathname)
  const og = `${SITE.url}/og.png`
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${m.url}" />`,
    `<meta name="robots" content="${m.missing ? 'noindex' : 'index, follow, max-image-preview:large, max-snippet:-1'}" />`,
    `<meta property="og:type" content="${pathname.startsWith('/blog/') ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${m.url}" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${og}" />`,
    m.jsonld ? `<script type="application/ld+json" id="ld">${JSON.stringify(m.jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
}

/* ---------- plain HTML for each page ----------
   Crawlers and AI tools that do not run JavaScript read this. It carries the same words the
   live page shows, and the app replaces it the moment it starts. */
const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
const link = (path, text) => `<a href="${path}">${esc(text)}</a>`
const servicesHtml = () => list(SERVICE_INFO.map((s) => `${link(serviceUrl(s), s.name)}: ${esc(s.line)}`))
const stepsHtml = () => `<ol>${STEPS.map(([n, t]) => `<li><strong>${esc(n)}.</strong> ${esc(t)}</li>`).join('')}</ol>`
const faqHtml = () => `<h2>Questions people ask first</h2><dl>${FAQS.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl>`
const contactHtml = () =>
  `<p>Phone: <a href="tel:${CONTACT.tel}">${CONTACT.phone}</a>. Email: <a href="mailto:${EMAIL}">${EMAIL}</a>. Office: ${esc(CONTACT.address)}.</p>`

export function bodyHtml(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const service = SERVICE_INFO.find((s) => serviceUrl(s) === path)
  const post = POSTS.find((p) => `/blog/${p.id}` === path)
  let main = ''

  if (path === '/') {
    main = `<h1>${SITE.name} builds websites, apps and automations people enjoy using</h1>
<p>${esc(SUMMARY)}</p>
<h2>What we do</h2>${servicesHtml()}
<h2>How a project runs</h2>${stepsHtml()}
<h2>Why work with us</h2>${list(REASONS.map(([t, d]) => `<strong>${esc(t)}.</strong> ${esc(d)}`))}
<h2>Plans</h2>${list(PLANS.map((p) => `<strong>${esc(p.name)}.</strong> ${esc(p.line)} ${esc(p.items.join(', '))}.`))}
<h2>From the blog</h2>${list(POSTS.map((p) => `${link(`/blog/${p.id}`, p.title)}: ${esc(p.intro)}`))}
${faqHtml()}`
  } else if (path === '/services') {
    main = `<h1>Ten services, one team</h1><p>Take one, or put several together.</p>${servicesHtml()}<h2>How a project runs</h2>${stepsHtml()}`
  } else if (service) {
    main = `<p>${link('/services', 'All services')}</p><h1>${esc(service.name)}</h1><p>${esc(service.line)}</p>
<h2>What you get</h2>${list(service.items.map(esc))}<h2>How it runs</h2>${stepsHtml()}<p>${link('/contact', 'Start a project')}</p>`
  } else if (path === '/work') {
    main = `<h1>Our work</h1><p>Websites, apps, marketing campaigns and business software built by ${SITE.name}.</p><p>${link('/contact', 'Start a project')}</p>`
  } else if (path === '/pricing') {
    main = `<h1>Clear prices before we start</h1><p>Three starting points. Tell us what you need and we shape the plan and the price around it.</p>
${list(PLANS.map((p) => `<strong>${esc(p.name)}.</strong> ${esc(p.line)} ${esc(p.items.join(', '))}.`))}${faqHtml()}`
  } else if (path === '/blog') {
    main = `<h1>Plain advice on websites, marketing and software</h1>${list(POSTS.map((p) => `${link(`/blog/${p.id}`, p.title)}: ${esc(p.intro)}`))}`
  } else if (post) {
    main = `<article><p>${link('/blog', 'All articles')}</p><h1>${esc(post.title)}</h1><p>${esc(post.intro)}</p>
${post.body.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('')}</article>`
  } else if (path === '/about') {
    main = `<h1>One team for the whole job</h1><p>${esc(SUMMARY)}</p>
<h2>Why work with us</h2>${list(REASONS.map(([t, d]) => `<strong>${esc(t)}.</strong> ${esc(d)}`))}<h2>How a project runs</h2>${stepsHtml()}`
  } else if (path === '/contact') {
    main = `<h1>Tell us what you're building</h1>${contactHtml()}${faqHtml()}`
  }

  const nav = [['/', 'Home'], ['/services', 'Services'], ['/work', 'Work'], ['/pricing', 'Pricing'], ['/blog', 'Blog'], ['/about', 'About'], ['/contact', 'Contact']]
  return `<div class="prerender">
<nav>${nav.map(([p, t]) => link(p, t)).join(' | ')}</nav>
<main>${main}</main>
<footer><p>${SITE.name}. ${esc(TAGLINE)}</p>${contactHtml()}</footer>
</div>`
}

/* ---------- sitemap, robots and llms.txt ---------- */
export function sitemapXml(date) {
  const rows = ROUTES.map((r) => `  <url><loc>${abs(r)}</loc><lastmod>${date}</lastmod><priority>${r === '/' ? '1.0' : r.split('/').length > 2 ? '0.7' : '0.8'}</priority></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`
}

export function robotsTxt() {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'Googlebot']
  return `# Search engines and AI assistants are welcome to read and cite this site.
User-agent: *
Allow: /

${bots.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}

Sitemap: ${SITE.url}/sitemap.xml
`
}

// A short guide for AI assistants (the llms.txt convention): who we are, and where the facts live.
export function llmsTxt(full = false) {
  const head = `# ${SITE.name}

> ${SUMMARY} ${TAGLINE}

- Location: ${CONTACT.address}, India
- Phone: ${CONTACT.phone}
- Email: ${EMAIL}
- Website: ${SITE.url}
`
  const services = `## Services\n\n${SERVICE_INFO.map((s) => `- [${s.name}](${abs(serviceUrl(s))}): ${s.line} Includes ${s.items.join(', ')}.`).join('\n')}\n`
  const pages = `## Pages\n\n- [Services](${abs('/services')}): all ten services\n- [Work](${abs('/work')}): projects\n- [Pricing](${abs('/pricing')}): plans\n- [Blog](${abs('/blog')}): articles\n- [About](${abs('/about')}): how the team works\n- [Contact](${abs('/contact')}): phone, email, address and enquiry form\n`
  const blog = `## Articles\n\n${POSTS.map((p) => `- [${p.title}](${abs(`/blog/${p.id}`)}): ${p.intro}`).join('\n')}\n`
  if (!full) return [head, services, pages, blog].join('\n')

  const process = `## How a project runs\n\n${STEPS.map(([n, t], i) => `${i + 1}. ${n}: ${t}`).join('\n')}\n`
  const faq = `## Frequently asked questions\n\n${FAQS.map(([q, a]) => `### ${q}\n\n${a}`).join('\n\n')}\n`
  const articles = POSTS.map((p) => `## ${p.title}\n\n${p.intro}\n\n${p.body.map(([h, t]) => `### ${h}\n\n${t}`).join('\n\n')}`).join('\n\n')
  return [head, services, process, faq, articles, ''].join('\n')
}
