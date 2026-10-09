import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PROJECTS } from '../data.js'

const SKINS = ['sun', 'tangerine', 'paper', 'mint']
const spring = { type: 'spring', stiffness: 260, damping: 24 }
const press = { whileHover: { x: -2, y: -2 }, whileTap: { x: 4, y: 4 } }

export default function Work() {
  const [order, setOrder] = useState(PROJECTS.map((_, i) => i))
  const [flipped, setFlipped] = useState(false)
  const top = order[0]

  const next = () => {
    setFlipped(false)
    setOrder((o) => [...o.slice(1), o[0]])
  }
  const prev = () => {
    setFlipped(false)
    setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)])
  }
  const bring = (i) => {
    setFlipped(false)
    setOrder((o) => {
      const k = o.indexOf(i)
      return [...o.slice(k), ...o.slice(0, k)]
    })
  }

  return (
    <section id="work" className="work">
      <div className="work-copy">
        <h2>Ten projects we're proud of</h2>
        <p>Fling the top card away to see the next one. Tap it to turn it over.</p>

        <div className="now" aria-live="polite">
          <strong>{PROJECTS[top].name}</strong>
          <span>
            {PROJECTS[top].type}, {top + 1} of {PROJECTS.length}
          </span>
        </div>

        <div className="dots">
          {PROJECTS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className={`dot bg-${SKINS[i % 4]}`}
              aria-label={`Show ${p.name}`}
              aria-current={i === top || undefined}
              onClick={() => bring(i)}
            />
          ))}
        </div>

        <div className="deck-btns">
          <motion.button type="button" className="btn btn-paper" onClick={prev} {...press}>
            Previous project
          </motion.button>
          <motion.button type="button" className="btn btn-paper" onClick={next} {...press}>
            Next project
          </motion.button>
          <motion.button type="button" className="btn btn-sun" onClick={() => setFlipped((f) => !f)} {...press}>
            Turn card over
          </motion.button>
        </div>
        <Link className="more on-dark" to="/work">
          See all ten on one page
        </Link>
      </div>

      <div className="deck">
        {PROJECTS.map((p, i) => {
          const d = order.indexOf(i)
          const isTop = d === 0
          return (
            <motion.div
              key={p.name}
              className="card"
              style={{ zIndex: 20 - d, pointerEvents: isTop ? 'auto' : 'none' }}
              animate={{
                x: d * 14,
                y: -d * 12,
                rotate: d ? (d % 2 ? 1 : -1) * d * 2.4 : 0,
                scale: 1 - d * 0.04,
                opacity: d < 4 ? 1 : 0,
              }}
              transition={spring}
              drag={isTop}
              dragSnapToOrigin
              dragElastic={0.9}
              whileDrag={{ cursor: 'grabbing' }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 700) next()
              }}
              onTap={() => isTop && setFlipped((f) => !f)}
            >
              <motion.div className="card-inner" animate={{ rotateY: isTop && flipped ? 180 : 0 }} transition={spring}>
                <div className={`face front bg-${SKINS[i % 4]}`}>
                  <div className={`shot ${i % 2 ? 'flip' : ''}`}>
                    <i className={`bg-${['grape', 'ink', 'tangerine', 'grape'][i % 4]}`} />
                    <div>
                      <b />
                      <b />
                      <b />
                      <em />
                    </div>
                  </div>
                  <h3>{p.name}</h3>
                  <div className="meta">
                    <span>{p.type}</span>
                    <span>Sample</span>
                  </div>
                </div>
                <div className="face back">
                  <h3>{p.name}</h3>
                  <p className="type">{p.type}</p>
                  <p className="blurb">{p.blurb}</p>
                  <p className="link">Your live link goes here</p>
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
