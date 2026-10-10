import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { EMAIL, SERVICES, SITE_INFO } from '../data.js'
import { MLink, press } from '../ui.jsx'
import { shapeFor } from './models.jsx'
import Studio from './Studio.jsx'

const TAU = Math.PI * 2

// All ten service models circle the headline; scrolling pushes them faster.
function Orbit() {
  const g = useRef(null)
  const { viewport } = useThree()
  const last = useRef(0)
  const push = useRef(0)
  const R = Math.min(viewport.width * 0.42, 6.6)
  const size = Math.max(0.3, Math.min(0.62, R / 9))

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    push.current += (Math.abs(scrollY - last.current) * 0.03 - push.current) * 0.1
    last.current = scrollY
    g.current.rotation.y += dt * (0.25 + push.current)
  })

  return (
    <group rotation={[0.45, 0, -0.08]}>
      <group ref={g}>
        {SERVICES.map((name, i) => {
          const a = (i / SERVICES.length) * TAU
          const Shape = shapeFor(name)
          return (
            <group key={name} position={[Math.sin(a) * R, 0, Math.cos(a) * R]} rotation={[0, a, 0]} scale={size}>
              <Shape />
            </group>
          )
        })}
      </group>
    </group>
  )
}

export default function Closing() {
  const reduce = useReducedMotion()
  const root = useRef(null)
  const inView = useInView(root, { margin: '100px' })
  const TEXT = SITE_INFO.closing.title || 'Got something to build?'

  return (
    <section className="closing" ref={root}>
      {!reduce && (
        <div className="closing-canvas" aria-hidden="true">
          <Canvas flat dpr={[1, 2]} frameloop={inView ? 'always' : 'never'} camera={{ fov: 35, position: [0, 0, 13] }} gl={{ alpha: true }}>
            <Studio sway={0.7} />
            <Orbit />
          </Canvas>
        </div>
      )}
      <h2 aria-label={TEXT}>
        {TEXT.split(' ').map((word, w) => (
          <span key={w} className="word" aria-hidden="true">
            {[...word].map((ch, i) => (
              <motion.span
                key={i}
                whileHover={{ y: -18, rotate: i % 2 ? 10 : -10, color: '#FFC933' }}
                transition={{ type: 'spring', stiffness: 500, damping: 12 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        ))}
      </h2>
      <div className="closing-actions">
        <MLink className="btn btn-blue" to="/contact" {...press}>
          {SITE_INFO.closing.button || 'Start a project'}
        </MLink>
        <motion.a className="btn btn-paper" href={`mailto:${EMAIL}`} {...press}>
          {EMAIL}
        </motion.a>
      </div>
    </section>
  )
}
