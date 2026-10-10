import { EMAIL } from './data.js'

// Messages are delivered by Web3Forms (https://web3forms.com). Put your access key in a file named
// .env.local next to package.json:  VITE_WEB3FORMS_KEY=your-key
// Without a key the site falls back to opening the visitor's own email app.
const KEY = import.meta.env.VITE_WEB3FORMS_KEY || ''

export const canSend = () => !!KEY

// Resolves to { ok: true } or { ok: false, reason }.
export async function send(subject, fields) {
  if (!KEY) return { ok: false, reason: 'nokey' }
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: KEY, subject, from_name: 'Aknova Tech website', ...fields }),
    })
    const json = await res.json().catch(() => ({}))
    return res.ok && json.success ? { ok: true } : { ok: false, reason: json.message || `Server answered ${res.status}` }
  } catch {
    return { ok: false, reason: 'offline' }
  }
}

export function openEmailApp(subject, body) {
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export const validEmail = (s) => /^\S+@\S+\.\S+$/.test(s)
