import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHero from '../components/PageHero.jsx'
import Process from '../components/Process.jsx'
import Tilt from '../components/Tilt.jsx'
import { SERVICE_INFO } from '../data.js'
import { press, slug, useOrder } from '../ui.jsx'

const TONE = ['sun', 'paper', 'sky', 'blue', 'paper', 'navy']

export default function ServicesPage() {
  const { picked, toggle } = useOrder()
  return (
    <>
      <PageHero
        title="Ten services, one team"
        text="Take one, or put several together. Add what you need to your order and send it when you are ready."
        models={['Web development', 'AI automation', 'SEO', 'Mobile app development', 'POS systems']}
      />
      <section className="svc-grid-wrap">
        <ul className="svc-grid">
          {SERVICE_INFO.map((s, i) => {
            const on = picked.includes(s.name)
            const tone = TONE[i % TONE.length]
            return (
              <Tilt as="li" key={s.name} className={`svc-card bg-${tone} ${tone === 'navy' ? 'on-dark' : ''}`}>
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
      <Process />
    </>
  )
}
