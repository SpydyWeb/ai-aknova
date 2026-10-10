import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE, seoFor } from '../seo.js'

function meta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  el.setAttribute('content', content)
}

// Keeps the title, description, canonical link and structured data in step with the page shown.
export default function Seo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const m = seoFor(pathname)
    document.title = m.title
    meta('name', 'description', m.description)
    meta('name', 'robots', m.missing ? 'noindex' : 'index, follow, max-image-preview:large, max-snippet:-1')
    meta('property', 'og:title', m.title)
    meta('property', 'og:description', m.description)
    meta('property', 'og:url', m.url)
    meta('property', 'og:site_name', SITE.name)
    meta('name', 'twitter:title', m.title)
    meta('name', 'twitter:description', m.description)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = m.url

    let ld = document.getElementById('ld')
    if (!ld) {
      ld = document.createElement('script')
      ld.type = 'application/ld+json'
      ld.id = 'ld'
      document.head.append(ld)
    }
    ld.textContent = m.jsonld ? JSON.stringify(m.jsonld) : ''
  }, [pathname])
  return null
}
