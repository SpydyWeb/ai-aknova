import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { STEPS } from '../data.js'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

const SKIN = ['sun', 'paper', 'blue', 'navy']

export default function Process() {
  const reduce = useReducedMotion()
  const root = useRef(null)

  // Scrolling draws the route and rolls the ball from brief to launch.
  useEffect(() => {
    if (reduce) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top 65%', end: 'bottom 92%', scrub: 0.6 },
      })
      tl.fromTo('.route-line', { strokeDashoffset: 1 }, { strokeDashoffset: 0 }, 0)
      tl.to('.route-ball', { motionPath: { path: '.route-line', align: '.route-line', alignOrigin: [0.5, 0.5] } }, 0)
      gsap.utils.toArray('.step').forEach((el, i) => {
        tl.from(el, { scale: 0.6, rotate: i % 2 ? 8 : -8, opacity: 0, duration: 0.18, ease: 'back.out(2)' }, i * 0.22)
      })
    }, root)
    return () => ctx.revert()
  }, [reduce])

  return (
    <section id="process" className="process" ref={root}>
      <h2>How a project runs</h2>
      <div className="route">
        <svg viewBox="0 0 1200 200" aria-hidden="true">
          <path
            className="route-line"
            pathLength="1"
            d="M10,100 C150,-10 250,210 400,100 S650,-10 800,100 S1050,210 1190,100"
          />
          <circle className="route-ball" r="16" cx="0" cy="0" />
        </svg>
        <ol>
          {STEPS.map(([name, text], i) => (
            <li key={name} className="step">
              <span className={`num bg-${SKIN[i]}`}>{i + 1}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
