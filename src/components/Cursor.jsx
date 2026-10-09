import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'

const SPARK = ['tangerine', 'sun', 'grape', 'mint']
const trail = { stiffness: 480, damping: 34, mass: 0.4 }

// A ring that trails the pointer, names what you can do, and sparks on click.
export default function Cursor() {
  const [on, setOn] = useState(false)
  const [label, setLabel] = useState('')
  const [hot, setHot] = useState(false)
  const [sparks, setSparks] = useState([])
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, trail)
  const sy = useSpring(y, trail)

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setOn(true)
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target instanceof Element ? e.target : null
      setLabel(document.body.dataset.cursor || t?.closest('[data-cursor]')?.dataset.cursor || '')
      setHot(!!t?.closest('a,button'))
    }
    const down = (e) => {
      const id = performance.now()
      setSparks((s) => [...s.slice(-3), { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => setSparks((s) => s.filter((k) => k.id !== id)), 600)
    }
    addEventListener('pointermove', move)
    addEventListener('pointerdown', down)
    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', down)
    }
  }, [x, y])

  if (!on) return null
  const size = label ? 74 : hot ? 54 : 30

  return (
    <div className="cursor-layer" aria-hidden="true">
      <motion.div className="cursor" style={{ x: sx, y: sy }}>
        <motion.span
          className={`cursor-ring ${label ? 'has-label' : ''}`}
          animate={{ width: size, height: size }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          {label}
        </motion.span>
      </motion.div>
      <AnimatePresence>
        {sparks.map((s) => (
          <div key={s.id} className="sparks" style={{ left: s.x, top: s.y }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2
              return (
                <motion.i
                  key={i}
                  className={`bg-${SPARK[i % 4]} ${i % 2 ? 'round' : ''}`}
                  initial={{ x: 0, y: 0, scale: 1, rotate: 0 }}
                  animate={{ x: Math.cos(a) * 46, y: Math.sin(a) * 46, scale: 0, rotate: 180 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              )
            })}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
