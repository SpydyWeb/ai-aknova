import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Tilt from './Tilt.jsx'
import { SERVICE_INFO } from '../data.js'
import { press, slug, useOrder } from '../ui.jsx'

const TONE = ['sun', 'paper', 'sky', 'blue', 'paper', 'navy']

// One card per service, each with an "Add to order" button.
export default function ServiceGrid() {
  const { picked, toggle } = useOrder()
  return (
    <section className="svc-grid-wrap">
        <ul className="svc-grid">
          {SERVICE_INFO.map((s, i) => {
            const on = picked.includes(s.name)
            const tone = TONE[i % TONE.length]
            return (
              <Tilt as="li" key={i} className={`svc-card bg-${tone} ${tone === 'navy' ? 'on-dark' : ''}`}>
                <h2>
                  <Link to={`/services/${slug(s.name)}`}>{s.name}</Link>
                </h2>
                <p>{s.line}</p>
                <ul className="chips">
                  {s.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <motion.button type="button" className={`btn ${on ? 'btn-ink' : 'btn-white'}`} onClick={() => toggle(s.name)} {...press}>
                  {on ? 'Remove from order' : 'Add to order'}
                </motion.button>
              </Tilt>
            )
          })}
        </ul>
    </section>
  )
}
