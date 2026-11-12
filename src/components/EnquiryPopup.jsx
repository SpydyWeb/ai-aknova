import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EMAIL, SERVICES, SITE_INFO } from '../data.js'
import { canSend, canWhatsApp, openEmailApp, openWhatsApp, send, validEmail } from '../send.js'
import { play } from '../sound.js'
import { press } from '../ui.jsx'
import Status from './Status.jsx'

const SEEN = 'aknova-enquiry-seen'
const WAIT = 10000
const started = Date.now()
const EMPTY = { name: '', email: '', phone: '', service: '', message: '' }

const seen = () => {
  try {
    return localStorage.getItem(SEEN) === '1'
  } catch {
    return true // storage blocked: never nag
  }
}
const markSeen = () => {
  try {
    localStorage.setItem(SEEN, '1')
  } catch {
    /* private window */
  }
}

// Opens once per visitor, ten seconds into the visit. Never on the contact page, where the full form already is.
export default function EnquiryPopup() {
  const { pathname } = useLocation()
  const box = useRef(null)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [state, setState] = useState('idle')
  const [note, setNote] = useState('')
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const P = SITE_INFO.popup

  useEffect(() => {
    if (!P.show || open || seen() || pathname.startsWith('/contact')) return
    const t = setTimeout(() => {
      markSeen()
      setOpen(true)
    }, Math.max(0, WAIT - (Date.now() - started)))
    return () => clearTimeout(t)
  }, [pathname, open, P.show])

  useEffect(() => {
    const d = box.current
    if (open && d && !d.open) d.showModal()
  }, [open])

  const close = () => {
    box.current?.close()
    setOpen(false)
  }

  const check = (needEmail) => {
    const err = {}
    if (!f.name.trim()) err.name = 'Add your name so we know who to reply to.'
    if (needEmail && !validEmail(f.email)) err.email = 'Enter an email address like name@example.com.'
    if (!f.message.trim() && !f.service) err.message = 'Pick a service or write a line about what you need.'
    setErrors(err)
    if (Object.keys(err).length) {
      play('buzz')
      document.getElementById(`q-${Object.keys(err)[0]}`)?.focus()
      return false
    }
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    if (state === 'sending' || !check(true)) return
    const subject = `New enquiry from ${f.name}`
    const fields = { name: f.name, email: f.email, phone: f.phone || 'Not given', services: f.service || 'Not picked', message: f.message || 'No message', source: 'Pop-up enquiry form' }
    setState('sending')
    setNote('')
    const r = await send(subject, fields)
    if (r.ok) {
      setState('sent')
      play('ding')
    } else if (r.reason === 'nokey') {
      setState('idle')
      setNote('Your email app should open with the message filled in. Press send there to finish.')
      openEmailApp(subject, Object.entries(fields).map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`).join('\n'))
    } else {
      setState('idle')
      play('buzz')
      setNote(`The message did not send. Check your connection and try again, or write to ${EMAIL}.`)
    }
  }

  const whatsapp = () => {
    if (!check(false)) return
    const lines = [`Hello, I am ${f.name.trim()}.`, f.message.trim(), f.service ? `Service: ${f.service}` : '', f.phone.trim() ? `Phone: ${f.phone.trim()}` : '']
    openWhatsApp(lines.filter(Boolean).join('\n'))
    setNote('WhatsApp opened with your message typed in. Press send there to finish.')
  }

  const field = (k, label, props = {}) => (
    <label className={`field ${errors[k] ? 'bad' : ''}`}>
      <span>{label}</span>
      {props.rows ? <textarea id={`q-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} /> : <input id={`q-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />}
      {errors[k] && <em role="alert">{errors[k]}</em>}
    </label>
  )

  if (!open) return null

  return (
    <dialog ref={box} className="enquiry" aria-labelledby="q-title" onClose={() => setOpen(false)} onClick={(e) => e.target === e.currentTarget && close()} data-lenis-prevent>
      <motion.div
        className="enquiry-card"
        initial={{ y: 60, rotate: 4, opacity: 0 }}
        animate={{ y: 0, rotate: -1.2, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <div className="enquiry-strip">
          <Status />
        </div>
        <button type="button" className="enquiry-x" data-sound="close" onClick={close}>
          <span className="sr">Close</span>
          <span aria-hidden="true">×</span>
        </button>

        {state === 'sent' ? (
          <div className="enquiry-body" role="status">
            <h2 id="q-title">Enquiry sent</h2>
            <p className="enquiry-lede">Thanks, {f.name.split(' ')[0]}. We will reply to {f.email}.</p>
            <motion.button type="button" className="btn btn-paper" onClick={close} {...press}>
              Back to the site
            </motion.button>
          </div>
        ) : (
          <form className="enquiry-body" onSubmit={submit} noValidate>
            <h2 id="q-title">{P.title || 'Tell us what you need'}</h2>
            <p className="enquiry-lede">{P.text || 'We reply within one working day.'}</p>
            <div className="pair">
              {field('name', 'Your name', { autoComplete: 'name' })}
              {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
            </div>
            {field('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
            <label className="field">
              <span>Service</span>
              <select id="q-service" value={f.service} onChange={set('service')}>
                <option value="">Not sure yet</option>
                {SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {field('message', 'A line about the project', { rows: 3 })}
            <div className="send-row">
              <motion.button type="submit" className="btn btn-blue" disabled={state === 'sending'} {...press}>
                {state === 'sending' ? 'Sending' : canSend() ? 'Send enquiry' : 'Send by email'}
              </motion.button>
              {canWhatsApp() && (
                <motion.button type="button" className="btn btn-whatsapp" onClick={whatsapp} {...press}>
                  Send on WhatsApp
                </motion.button>
              )}
            </div>
            <p className="status" role="status">
              {note}
            </p>
          </form>
        )}
      </motion.div>
    </dialog>
  )
}
