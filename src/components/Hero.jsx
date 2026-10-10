import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'

const Playground = lazy(() => import('./Playground.jsx'))

import { MLink, press } from '../ui.jsx'

export default function Hero({ before, words, after, text, primaryLabel, primaryTo, secondaryLabel, secondaryTo }) {
  const WORDS = (words || []).filter((w) => w?.text).map((w) => [w.text, w.tone || 'sun'])
  if (!WORDS.length) WORDS.push(['', 'sun'])
  const reduce = useReducedMotion()
  const root = useRef(null)
  const [i, setI] = useState(0)
  const [label, setLabel] = useState(null)
  const [inView, setInView] = useState(true)
  const [shake, setShake] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200)
    return () => clearInterval(t)
  }, [reduce, WORDS.length])

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

  const [word, color] = WORDS[i % WORDS.length]

  return (
    <section id="top" className="hero" ref={root}>
      {!reduce && (
        <div className="hero-canvas">
          <Suspense fallback={null}>
            <Playground active={inView} shake={shake} onPop={(name) => setLabel({ name, k: Date.now() })} />
          </Suspense>
        </div>
      )}

      <div className="hero-copy">
        <h1 aria-label={[before, WORDS.map((w) => w[0]).join(', '), after].filter(Boolean).join(' ')}>
          <span className="line" aria-hidden="true">
            <span className="rise">{before}</span>
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
            <span className="rise">{after}</span>
          </span>
        </h1>

        <div className="hero-sub">
          {text && <p className="lede">{text}</p>}
          <div className="hero-actions">
            {primaryLabel && (
              <MLink className="btn btn-blue" to={primaryTo || '/contact'} {...press}>
                {primaryLabel}
              </MLink>
            )}
            {secondaryLabel && (
              <MLink className="btn btn-paper" to={secondaryTo || '/'} {...press}>
                {secondaryLabel}
              </MLink>
            )}
            {!reduce && (
              <motion.button type="button" className="btn btn-sun" data-sound="swish" onClick={() => setShake((n) => n + 1)} {...press}>
                Shake the toys
              </motion.button>
            )}
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
