import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'

const trail = { stiffness: 320, damping: 30, mass: 0.5 }
const WORDS = ['Nice!', 'Boom!', 'Website!', 'App!', 'SEO!', 'Aknova!', "What's next?", 'Built!']
const SKINS = [
  ['#ffffff', '#0B0E14'],
  ['#FFC933', '#0B0E14'],
  ['#1463FF', '#ffffff'],
  ['#0B0E14', '#ffffff'],
]
const BITS = ['#1463FF', '#FFC933', '#0B0E14', '#9CCBFF']

// The ring takes a colour that stands out against whatever it is over.
const AGAINST = {
  'rgb(243, 246, 255)': '#1463FF',
  'rgb(255, 255, 255)': '#1463FF',
  'rgb(255, 201, 51)': '#0A1F5C',
  'rgb(10, 31, 92)': '#FFC933',
  'rgb(156, 203, 255)': '#0A1F5C',
  'rgb(20, 99, 255)': '#FFC933',
  'rgb(11, 14, 20)': '#9CCBFF',
}
function colourOver(el) {
  for (let n = el, i = 0; n && n !== document.documentElement && i < 14; n = n.parentElement, i++) {
    const bg = getComputedStyle(n).backgroundColor
    if (bg.startsWith('rgb(')) return AGAINST[bg] || '#1463FF'
  }
  return '#1463FF'
}

// Confetti is drawn on one canvas so many pieces can fall smoothly at once.
function useConfetti(canvas) {
  const bits = useRef([])
  const running = useRef(false)
  const frame = () => {
    const c = canvas.current
    if (!c) return (running.current = false)
    const g = c.getContext('2d')
    const dpr = Math.min(devicePixelRatio, 2)
    if (c.width !== innerWidth * dpr || c.height !== innerHeight * dpr) {
      c.width = innerWidth * dpr
      c.height = innerHeight * dpr
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, innerWidth, innerHeight)
    bits.current = bits.current.filter((b) => b.life > 0)
    for (const b of bits.current) {
      b.vy += 0.32
      b.vx *= 0.985
      b.x += b.vx
      b.y += b.vy
      b.r += b.spin
      b.life -= 0.016
      g.save()
      g.globalAlpha = Math.min(1, b.life * 2.2)
      g.translate(b.x, b.y)
      g.rotate(b.r)
      g.fillStyle = b.c
      if (b.round) {
        g.beginPath()
        g.arc(0, 0, b.s / 2, 0, Math.PI * 2)
        g.fill()
      } else g.fillRect(-b.s / 2, -b.s / 2, b.s, b.s)
      g.restore()
    }
    if (bits.current.length) requestAnimationFrame(frame)
    else running.current = false
  }
  return (x, y) => {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2
      const v = 2 + Math.random() * 5
      bits.current.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 3.5,
        r: Math.random() * 6,
        spin: (Math.random() - 0.5) * 0.4,
        s: 3 + Math.random() * 5,
        c: BITS[i % 4],
        round: i % 2 === 0,
        life: 0.9 + Math.random() * 0.5,
      })
    }
    if (!running.current) {
      running.current = true
      requestAnimationFrame(frame)
    }
  }
}

// Keeps the normal arrow. A coloured ring trails it and names what you can do; every click
// pops a word sticker, a soft ripple and a burst of confetti.
export default function Cursor() {
  const [on, setOn] = useState(false)
  const [label, setLabel] = useState('')
  const [hot, setHot] = useState(false)
  const [down, setDown] = useState(false)
  const [colour, setColour] = useState('#1463FF')
  const [pops, setPops] = useState([])
  const canvas = useRef(null)
  const count = useRef(0)
  const lastTarget = useRef(null)
  const burst = useConfetti(canvas)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, trail)
  const sy = useSpring(y, trail)

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    setOn(true)

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
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('input,textarea,select')) return
      const n = count.current++
      const id = `${performance.now()}-${n}`
      burst(e.clientX, e.clientY)
      setPops((p) => [...p.slice(-4), { id, x: e.clientX, y: e.clientY, word: WORDS[n % WORDS.length], skin: SKINS[n % SKINS.length], tilt: (Math.random() - 0.5) * 22 }])
      setTimeout(() => setPops((p) => p.filter((k) => k.id !== id)), 1300)
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
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', press)
      removeEventListener('pointerup', lift)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [x, y]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!on) return null
  const size = label ? 78 : hot ? 52 : 34

  return (
    <div className="cursor-layer" aria-hidden="true">
      <canvas ref={canvas} className="cursor-confetti" />
      <motion.div className="cursor" style={{ x: sx, y: sy }}>
        <motion.span
          className={`cursor-ring ${label ? 'has-label' : ''}`}
          style={{ borderColor: colour, backgroundColor: label ? colour : 'transparent', color: colour === '#FFC933' || colour === '#9CCBFF' ? '#0B0E14' : '#ffffff' }}
          animate={{ width: size, height: size, scale: down ? 0.8 : 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        >
          {label}
        </motion.span>
      </motion.div>

      <AnimatePresence>
        {pops.map((p) => (
          <div key={p.id} className="pop" style={{ left: p.x, top: p.y }}>
            <motion.span
              className="pop-ring"
              style={{ borderColor: colour }}
              initial={{ scale: 0.2, opacity: 0.55 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            />
            <motion.span
              className="pop-word"
              style={{ background: p.skin[0], color: p.skin[1] }}
              initial={{ y: -18, scale: 0.3, rotate: p.tilt * 2, opacity: 0 }}
              animate={{ y: [-18, -62, -96], scale: [0.3, 1.08, 1], rotate: p.tilt, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.22, 1], opacity: { duration: 1.2, times: [0, 0.12, 0.6, 1] }, ease: 'easeOut' }}
            >
              {p.word}
            </motion.span>
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
