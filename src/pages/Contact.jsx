import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { motion, useReducedMotion } from 'framer-motion'
import Till from '../components/Till.jsx'
import Faq from '../components/Faq.jsx'
import { Envelope } from '../components/models.jsx'
import { EMAIL } from '../data.js'
import { press, useOrder } from '../ui.jsx'

// Sits and bobs; when a message is sent it flies off, then a fresh one pops back.
function Letter({ sent }) {
  const g = useRef(null)
  const t = useRef(9)
  useEffect(() => {
    if (sent) t.current = 0
  }, [sent])
  useFrame((_, delta) => {
    t.current += Math.min(delta, 0.05)
    const k = t.current
    if (k < 0.9) {
      const e = (k / 0.9) ** 2
      g.current.position.set(e * 7, e * 4, -e * 4)
      g.current.rotation.set(0, e * 6, -e * 1.2)
      g.current.scale.setScalar(1.25 * (1 - e * 0.7))
    } else if (k < 1.5) {
      g.current.scale.setScalar(0.001)
    } else {
      g.current.position.set(0, 0, 0)
      g.current.rotation.set(0, 0, -0.12)
      g.current.scale.setScalar(1.25 * Math.min(1, (k - 1.5) * 4))
    }
  })
  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1}>
      <group ref={g} rotation={[0, 0, -0.12]} scale={1.25}>
        <Envelope />
      </group>
    </Float>
  )
}

const EMPTY = { name: '', email: '', phone: '', message: '' }

export default function Contact() {
  const reduce = useReducedMotion()
  const { picked, toggle } = useOrder()
  const [f, setF] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(0)
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!f.name.trim()) err.name = 'Add your name so we know who to reply to.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'Enter an email address like name@example.com.'
    if (!f.message.trim() && !picked.length) err.message = 'Write a line about what you need, or add a service to your order.'
    setErrors(err)
    if (Object.keys(err).length) {
      document.getElementById(`f-${Object.keys(err)[0]}`)?.focus()
      return
    }
    const body = [
      `Name: ${f.name}`,
      `Email: ${f.email}`,
      f.phone ? `Phone: ${f.phone}` : null,
      picked.length ? `Services: ${picked.join(', ')}` : null,
      '',
      f.message,
    ]
      .filter((x) => x !== null)
      .join('\n')
    setSent((n) => n + 1)
    setTimeout(() => {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`New project from ${f.name}`)}&body=${encodeURIComponent(body)}`
    }, 900)
  }

  const field = (k, label, props = {}) => (
    <label className={`field ${errors[k] ? 'bad' : ''}`}>
      <span>{label}</span>
      {props.rows ? (
        <textarea id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      ) : (
        <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      )}
      {errors[k] && (
        <em id={`e-${k}`} role="alert">
          {errors[k]}
        </em>
      )}
    </label>
  )

  return (
    <>
      <section className="contact">
        <div className="contact-copy">
          <h1>Tell us what you're building</h1>
          <p className="lede">Fill this in and your email app opens with the message ready. Press send there and it reaches us.</p>

          <form onSubmit={submit} noValidate>
            <div className="pair">
              {field('name', 'Your name', { autoComplete: 'name' })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
            </div>
            {field('phone', 'Phone (optional)', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
            {field('message', 'What do you need?', { rows: 5 })}

            {picked.length > 0 && (
              <div className="on-order">
                <span>On your order</span>
                <ul className="chips">
                  {picked.map((s) => (
                    <li key={s}>
                      {s}
                      <button type="button" aria-label={`Remove ${s}`} onClick={() => toggle(s)}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <motion.button type="submit" className="btn btn-tangerine" {...press}>
              Open email with this message
            </motion.button>
            <p className="status" aria-live="polite">
              {sent > 0 && 'Your email app should open with the message filled in. Press send there to finish.'}
            </p>
          </form>
        </div>

        <aside className="contact-side">
          {!reduce && (
            <div className="letter" aria-hidden="true">
              <Canvas flat dpr={[1, 2]} camera={{ fov: 35, position: [0, 0, 7] }} gl={{ alpha: true }} style={{ pointerEvents: 'none' }}>
                <ambientLight intensity={1.1} />
                <directionalLight position={[4, 6, 8]} intensity={1.9} />
                <Letter sent={sent} />
              </Canvas>
            </div>
          )}
          {/* Placeholders: replace with your real contact details. */}
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>Your phone number</dd>
            </div>
            <div>
              <dt>Office</dt>
              <dd>Your office address</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>Your working hours</dd>
            </div>
          </dl>
        </aside>
      </section>
      <Till />
      <Faq />
    </>
  )
}
