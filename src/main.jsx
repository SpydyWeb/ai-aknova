import { createRoot } from 'react-dom/client'
import snapshot from '../content/site.json'
import { setContent } from './data.js'

// The content is loaded before any component, so every part of the site reads the saved version.
// The server normally places it in the page; otherwise it is fetched; and if there is no server at
// all (plain file hosting) the copy taken when the site was built is used.
async function content() {
  if (window.__CONTENT__) return window.__CONTENT__
  try {
    const res = await fetch('/api/content', { cache: 'no-store' })
    if (res.ok && (res.headers.get('content-type') || '').includes('json')) return await res.json()
  } catch {
    /* no server: fall through to the built-in copy */
  }
  return snapshot
}

async function start() {
  setContent(await content())
  const admin = window.location.pathname.replace(/\/+$/, '') === '/admin'
  let App
  if (admin) App = (await import('./admin/Admin.jsx')).default
  else App = (await import('./App.jsx')).default
  createRoot(document.getElementById('root')).render(<App />)
}
start()
