import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'

const Playground = lazy(() => import('./Playground.jsx'))

const WORDS = [
  ['websites', 'sun'],
  ['mobile apps', 'mint'],
  ['AI automations', 'grape'],
  ['campaigns', 'tangerine'],
  ['CRM systems', 'sun'],
  ['POS systems', 'mint'],
]
import { MLink, press } from '../ui.jsx'

export default function Hero() {
  const reduce = useReducedMotion()
  const root = useRef(null)
  const [i, setI] = useState(0)
  const [label, setLabel] = useState(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200)
    return () => clearInterval(t)
  }, [reduce])

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(root.current)
    return () => io.disconnect()
  }, [])

  // The one load sequence on the page.
  useEffect(() => {
    if (reduce) return
    const ctx = gsap.context(() => {
      gsap.from('.rise', { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.1 })
      gsap.from('.chip-wrap', { scale: 0, rotate: -20, duration: 0.7, ease: 'back.out(2)', delay: 0.35 })
      gsap.from('.hero-sub > *', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08, delay: 0.7 })
    }, root)
    return () => ctx.revert()
  }, [reduce])

  useEffect(() => {
    if (!label) return
    const t = setTimeout(() => setLabel(null), 1800)
    return () => clearTimeout(t)
  }, [label])

  const [word, color] = WORDS[i]

  return (
    <section id="top" className="hero" ref={root}>
      {!reduce && (
        <div className="hero-canvas">
          <Suspense fallback={null}>
            <Playground active={inView} onPop={(name) => setLabel({ name, k: Date.now() })} />
          </Suspense>
        </div>
      )}

      <div className="hero-copy">
        <h1 aria-label="We build websites, apps and automations people enjoy using.">
          <span className="line" aria-hidden="true">
            <span className="rise">We build</span>
          </span>
          <span className="line chip-line" aria-hidden="true">
            <span className="chip-wrap">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={word}
                  className={`chip bg-${color}`}
                  initial={{ y: 40, rotate: 6, opacity: 0 }}
                  animate={{ y: 0, rotate: -2, opacity: 1 }}
                  exit={{ y: -40, rotate: -8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                >
                  {word}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
          <span className="line" aria-hidden="true">
            <span className="rise">people enjoy using.</span>
          </span>
        </h1>

        <div className="hero-sub">
          <p className="lede">
            Anova AI is one team for design, development and marketing. Ten services, from your first website to the
            software that runs your shop.
          </p>
          <div className="hero-actions">
            <MLink className="btn btn-tangerine" to="/contact" {...press}>
              Start a project
            </MLink>
            <MLink className="btn btn-paper" to="/work" {...press}>
              See our work
            </MLink>
            {!reduce && <p className="hint">Pick something up and throw it. Tap it to see what it is.</p>}
          </div>
        </div>
      </div>

      <div className="pop-label" aria-live="polite">
        <AnimatePresence>
          {label && (
            <motion.div
              key={label.k}
              className="sticker"
              initial={{ scale: 0, rotate: -14 }}
              animate={{ scale: 1, rotate: -4 }}
              exit={{ scale: 0, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              {label.name}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
