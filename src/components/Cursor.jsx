import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { play } from '../sound.js'

const SPARK = ['tangerine', 'sun', 'grape', 'mint']
const trail = { stiffness: 480, damping: 34, mass: 0.4 }

// The cursor takes a colour that stands out against whatever it is over.
const AGAINST = {
  'rgb(255, 244, 220)': '#FF5B1F',
  'rgb(255, 255, 255)': '#FF5B1F',
  'rgb(255, 201, 51)': '#6B4BFF',
  'rgb(107, 75, 255)': '#FFC933',
  'rgb(31, 214, 162)': '#6B4BFF',
  'rgb(255, 91, 31)': '#FFF4DC',
  'rgb(23, 19, 14)': '#1FD6A2',
}
function colourOver(el) {
  for (let n = el, i = 0; n && n !== document.documentElement && i < 14; n = n.parentElement, i++) {
    const bg = getComputedStyle(n).backgroundColor
    if (bg.startsWith('rgb(')) return AGAINST[bg] || '#FF5B1F'
  }
  return '#FF5B1F'
}

// Replaces the pointer with a coloured dot and a trailing ring that names what you can do.
export default function Cursor() {
  const [on, setOn] = useState(false)
  const [label, setLabel] = useState('')
  const [hot, setHot] = useState(false)
  const [down, setDown] = useState(false)
  const [colour, setColour] = useState('#FF5B1F')
  const [sparks, setSparks] = useState([])
  const lastTarget = useRef(null)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, trail)
  const sy = useSpring(y, trail)

  useEffect(() => {
    // Every press on a control makes a sound, with or without the custom cursor.
    const sound = (e) => {
      const t = e.target instanceof Element ? e.target.closest('a,button') : null
      if (t) play(t.dataset.sound || 'tap')
    }
    addEventListener('pointerdown', sound)

    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => removeEventListener('pointerdown', sound)
    }
    setOn(true)
    document.documentElement.classList.add('has-cursor')

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target instanceof Element ? e.target : null
      setLabel(document.body.dataset.cursor || t?.closest('[data-cursor]')?.dataset.cursor || '')
      setHot(!!t?.closest('a,button'))
      if (t && t !== lastTarget.current) {
        lastTarget.current = t
        setColour(colourOver(t))
      }
    }
    const press = (e) => {
      setDown(true)
      const id = performance.now()
      setSparks((s) => [...s.slice(-3), { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => setSparks((s) => s.filter((k) => k.id !== id)), 600)
    }
    const lift = () => setDown(false)
    const leave = () => {
      x.set(-100)
      y.set(-100)
    }
    addEventListener('pointermove', move)
    addEventListener('pointerdown', press)
    addEventListener('pointerup', lift)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      removeEventListener('pointerdown', sound)
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', press)
      removeEventListener('pointerup', lift)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [x, y])

  if (!on) return null
  const size = label ? 78 : hot ? 56 : 34

  return (
    <div className="cursor-layer" aria-hidden="true">
      <motion.div className="cursor" style={{ x: sx, y: sy }}>
        <motion.span
          className={`cursor-ring ${label ? 'has-label' : ''}`}
          style={{ borderColor: colour, backgroundColor: label ? colour : 'transparent' }}
          animate={{ width: size, height: size, scale: down ? 0.8 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          {label}
        </motion.span>
      </motion.div>
      <motion.div className="cursor" style={{ x, y }}>
        <motion.span className="cursor-dot" style={{ backgroundColor: colour }} animate={{ scale: down ? 1.8 : label ? 0 : 1 }} transition={{ duration: 0.15 }} />
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
