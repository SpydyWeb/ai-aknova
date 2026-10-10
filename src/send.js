import { CONTENT, EMAIL, SITE_INFO } from './data.js'

// Messages are delivered by Web3Forms (https://web3forms.com). Paste your access key in the admin
// panel under Site details (or in .env.local as VITE_WEB3FORMS_KEY).
// Without a key the site falls back to opening the visitor's own email app.
const key = () => CONTENT.site?.web3formsKey?.trim() || import.meta.env.VITE_WEB3FORMS_KEY || ''

export const canSend = () => !!key()

// Resolves to { ok: true } or { ok: false, reason }.
export async function send(subject, fields) {
  const KEY = key()
  if (!KEY) return { ok: false, reason: 'nokey' }
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: KEY, subject, from_name: `${SITE_INFO.name} website`, ...fields }),
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
