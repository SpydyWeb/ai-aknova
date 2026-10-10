import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SERVICE_INFO } from '../data.js'
import { MLink, press, slug, useOrder } from '../ui.jsx'
import ModelStage from './ModelStage.jsx'

const SPOT = ['sun', 'sky', 'navy', 'blue']

export default function Services({ title, text }) {
  const { picked, toggle } = useOrder()
  const [i, setI] = useState(0)
  const s = SERVICE_INFO[i] || SERVICE_INFO[0]
  if (!s) return null
  const on = picked.includes(s.name)

  return (
    <section id="services" className="services">
      <div className="services-head">
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>

      <ul className="svc-list">
        {SERVICE_INFO.map((x, k) => (
          <li key={x.name}>
            <button type="button" className="svc" aria-pressed={k === i} onClick={() => setI(k)} onPointerEnter={(e) => e.pointerType === 'mouse' && setI(k)}>
              {x.name}
            </button>
          </li>
        ))}
        <li>
          <Link className="more" to="/services">
            See all services
          </Link>
        </li>
      </ul>

      <div className="svc-panel">
        <ModelStage name={s.name} spot={SPOT[i % 4]} />
        <div className="svc-text" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <h3>{s.name}</h3>
              <p>{s.line}</p>
              <ul className="chips">
                {s.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
          <div className="row">
            <motion.button type="button" className={`btn ${on ? 'btn-ink' : 'btn-sun'}`} onClick={() => toggle(s.name)} {...press}>
              {on ? 'Remove from order' : 'Add to order'}
            </motion.button>
            <MLink className="btn btn-paper" to={`/services/${slug(s.name)}`} {...press}>
              More about this service
            </MLink>
          </div>
        </div>
      </div>
    </section>
  )
}
