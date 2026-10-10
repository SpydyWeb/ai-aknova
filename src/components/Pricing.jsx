import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PLANS } from '../data.js'
import { press, useOrder } from '../ui.jsx'
import Tilt from './Tilt.jsx'
import CoinStack from './CoinStack.jsx'

const MODES = [
  ['once', 'One-time project', 'one-time'],
  ['monthly', 'Monthly care', 'per month'],
]

export default function Pricing() {
  const [mode, setMode] = useState('once')
  const { addMany } = useOrder()
  const navigate = useNavigate()
  const unit = MODES.find((m) => m[0] === mode)[2]

  const choose = (plan) => {
    addMany(plan.services)
    navigate('/contact')
  }

  return (
    <section id="pricing" className="pricing">
      <div className="pricing-head">
        <CoinStack count={mode === 'once' ? 8 : 3} />
        <h2>Pick a plan, or build your own</h2>
        <p>Every plan can be changed to fit. Choosing one adds its services to your order.</p>
        <div className="switch" role="group" aria-label="How you pay">
          {MODES.map(([id, label]) => (
            <button key={id} type="button" data-sound="coin" aria-pressed={mode === id} onClick={() => setMode(id)}>
              {mode === id && <motion.span layoutId="switch-pill" className="pill" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="plans">
        {PLANS.map((p) => (
          <Tilt as="li" key={p.name} max={8} className={`plan ${p.best ? 'best' : ''}`}>
            {p.best && <span className="flag">Most chosen</span>}
            <h3>{p.name}</h3>
            <p className="line">{p.line}</p>
            <p className="price">
              <motion.strong key={mode} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
                ₹{p[mode]}
              </motion.strong>
              <span>{unit}</span>
            </p>
            <ul>
              {p.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <motion.button type="button" className={`btn ${p.best ? 'btn-sun' : 'btn-blue'}`} onClick={() => choose(p)} {...press}>
              Choose {p.name}
            </motion.button>
          </Tilt>
        ))}
      </ul>
    </section>
  )
}
