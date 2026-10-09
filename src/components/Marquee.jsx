import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SERVICES } from '../data.js'

gsap.registerPlugin(ScrollTrigger)

export default function Marquee() {
  const reduce = useReducedMotion()
  const root = useRef(null)

  // Drifts on its own and speeds up with the scroll.
  useEffect(() => {
    if (reduce) return
    const ctx = gsap.context(() => {
      const drift = gsap.to('.mq-track', { xPercent: -50, duration: 36, ease: 'none', repeat: -1 })
      ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 7)
          gsap.to(drift, { timeScale: boost, duration: 0.2, overwrite: true })
          gsap.to(drift, { timeScale: 1, duration: 1.2, delay: 0.25 })
        },
      })
    }, root)
    return () => ctx.revert()
  }, [reduce])

  const row = (hidden) => (
    <ul aria-hidden={hidden || undefined}>
      {SERVICES.map((s, i) => (
        <li key={s}>
          {s}
          <i className={`bit bit-${i % 3}`} />
        </li>
      ))}
    </ul>
  )

  return (
    <div className="mq" ref={root}>
      <div className="mq-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
