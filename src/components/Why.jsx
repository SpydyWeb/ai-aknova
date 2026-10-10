import { useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { REASONS, VIDEOS } from '../data.js'
import Clip from './Clip.jsx'

const soft = { stiffness: 260, damping: 20 }

function Card({ title, text, color, video }) {
  const [flipped, setFlipped] = useState(false)
  const rx = useSpring(useMotionValue(0), soft)
  const ry = useSpring(useMotionValue(0), soft)

  // Leans toward the pointer.
  const lean = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 22)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 22)
  }
  const rest = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.button
      type="button"
      className="why-card"
      aria-pressed={flipped}
      data-cursor="Turn"
      data-sound="flip"
      onPointerMove={lean}
      onPointerLeave={rest}
      onClick={() => setFlipped((f) => !f)}
      style={{ rotateX: rx, rotateY: ry }}
    >
      <motion.span className="why-inner" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', ...soft }}>
        <span className={`why-face bg-${color}`}>
          <Clip file={video} label={`Video: ${title}`} />
          <strong>{title}</strong>
        </span>
        <span className="why-face why-back">{text}</span>
      </motion.span>
    </motion.button>
  )
}

export default function Why() {
  return (
    <section className="why">
      <h2>Why work with us</h2>
      <p>Tap a card to turn it over.</p>
      <div className="why-grid">
        {REASONS.map(([title, text, color], i) => (
          <Card key={title} title={title} text={text} color={color} video={VIDEOS.why[i]} />
        ))}
      </div>
    </section>
  )
}
