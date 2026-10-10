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

// The headline and text fonts, so the first thing painted is already in the right type.
// Waits at most a second and a half: on a bad connection the page still opens.
function fonts() {
  if (!document.fonts?.load) return Promise.resolve()
  const wanted = ["800 1em 'Unbounded'", "700 1em 'Unbounded'", "500 1em 'Instrument Sans'", "700 1em 'Instrument Sans'"]
  const loaded = Promise.all(wanted.map((f) => document.fonts.load(f))).catch(() => {})
  return Promise.race([loaded, new Promise((r) => setTimeout(r, 1500))])
}

async function start() {
  const admin = window.location.pathname.replace(/\/+$/, '') === '/admin'
  // Fonts are fetched alongside everything else, and the page is drawn once all of it is in.
  const type = fonts()
  // The content must be in place before any component file is read, so this order matters.
  setContent(await content())
  let App
  if (admin) App = (await import('./admin/Admin.jsx')).default
  else App = (await import('./App.jsx')).default
  await type
  createRoot(document.getElementById('root')).render(<App />)
  // Lift the cover just after the first paint. The timer covers tabs opened in the background,
  // where the browser holds animation frames back.
  const lift = () => document.getElementById('boot')?.remove()
  requestAnimationFrame(() => requestAnimationFrame(lift))
  setTimeout(lift, 250)
}
start()
