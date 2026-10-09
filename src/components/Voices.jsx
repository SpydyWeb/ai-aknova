import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { VOICES } from '../data.js'

const TILT = [-5, 3, -2, 6, -4, 2]
const SKIN = ['paper', 'mint', 'paper', 'tangerine', 'paper', 'grape']

export default function Voices() {
  const board = useRef(null)
  const [order, setOrder] = useState(VOICES.map((v) => v.id))
  const lift = (id) => setOrder((o) => [...o.filter((x) => x !== id), id])

  return (
    <section className="voices">
      <h2>What clients say</h2>
      <p>Drag the notes around. Tap one to bring it to the front.</p>
      <div className="board" ref={board}>
        {VOICES.map((v, i) => (
          <motion.figure
            key={v.id}
            className={`note bg-${SKIN[i]} ${SKIN[i] === 'grape' ? 'on-dark' : ''}`}
            data-cursor="Drag"
            style={{ zIndex: order.indexOf(v.id) + 1, rotate: TILT[i] }}
            drag
            dragConstraints={board}
            dragElastic={0.15}
            whileHover={{ scale: 1.03 }}
            whileDrag={{ scale: 1.08, rotate: 0, cursor: 'grabbing' }}
            onPointerDown={() => lift(v.id)}
          >
            <blockquote>{v.quote}</blockquote>
            <figcaption>{v.who}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
