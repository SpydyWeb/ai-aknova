import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import { TOY as C, STEPS } from '../data.js'
import { play } from '../sound.js'
import { Coin, Heart, Ink, Mat, Phone, Robot } from './models.jsx'
import Studio from './Studio.jsx'

const TAU = Math.PI * 2
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// 0 before `a`, 1 after `b`, smooth in between.
const span = (p, a, b) => {
  const t = clamp((p - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const CONFETTI = [C.sun, C.blue, C.navy, '#ffffff']

// One piece of the build: it flies in from `from` and grows while the scroll passes a..b.
function Part({ p, a, b, pos, from = [0, 0, 0], spin = 0, children }) {
  const g = useRef(null)
  useFrame(() => {
    const k = span(p.current, a, b)
    g.current.position.set(pos[0] + from[0] * (1 - k), pos[1] + from[1] * (1 - k), pos[2] + from[2] * (1 - k))
    g.current.rotation.z = (1 - k) * spin
    g.current.scale.setScalar(Math.max(k, 0.0001))
  })
  return <group ref={g}>{children}</group>
}

function Scene({ p }) {
  const g = useRef(null)
  const bits = useRef(null)
  const { viewport } = useThree()
  const look = useRef({ x: 0, y: 0 })
  const fired = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () => Array.from({ length: 90 }, () => ({ p: new THREE.Vector3(0, -99, 0), v: new THREE.Vector3(), r: new THREE.Euler(), s: 0 })),
    [],
  )
  const narrow = viewport.width < 7
  const unit = Math.min(1, viewport.width / 9.5)

  useEffect(() => {
    const move = (e) => {
      look.current.x = (e.clientX / innerWidth) * 2 - 1
      look.current.y = (e.clientY / innerHeight) * 2 - 1
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    parts.forEach((_, i) => bits.current.setColorAt(i, c.set(CONFETTI[i % 4])))
    bits.current.instanceColor.needsUpdate = true
  }, [parts])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = p.current
    const launch = span(t, 0.78, 0.96)
    // At launch the whole build jumps and turns once; confetti goes off as it leaves the ground.
    g.current.rotation.y = look.current.x * 0.3 + launch * TAU + Math.sin(clock.elapsedTime * 0.8) * 0.06
    g.current.rotation.x = look.current.y * 0.14
    g.current.position.y = Math.sin(launch * Math.PI) * 1.1 + (narrow ? 1.1 : 0.2)
    g.current.scale.setScalar(unit)

    if (t > 0.84 && !fired.current) {
      fired.current = true
      play('ding')
      parts.forEach((q) => {
        q.p.set((Math.random() - 0.5) * 3, 0, 1)
        q.v.set((Math.random() - 0.5) * 9, 4 + Math.random() * 7, (Math.random() - 0.5) * 4)
        q.s = 0.09 + Math.random() * 0.1
      })
    }
    if (t < 0.7) fired.current = false
    parts.forEach((q, i) => {
      if (q.p.y > -20) {
        q.v.y -= 14 * dt
        q.p.addScaledVector(q.v, dt)
        q.r.x += dt * 6
        q.r.z += dt * 4
      }
      dummy.position.copy(q.p)
      dummy.rotation.copy(q.r)
      dummy.scale.setScalar(q.s)
      dummy.updateMatrix()
      bits.current.setMatrixAt(i, dummy.matrix)
    })
    bits.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <Studio wall={-1.4} sway={0.5} />
      <group ref={g}>
        {/* Brief: an empty window arrives. */}
        <Part p={p} a={0.02} b={0.14} pos={[0, 0, 0]} spin={-0.6}>
          <RoundedBox args={[4.4, 3, 0.34]} radius={0.16}><Mat color={C.navy} /><Ink /></RoundedBox>
        </Part>
        <Part p={p} a={0.1} b={0.2} pos={[0, -0.2, 0.16]}>
          <RoundedBox args={[3.95, 2.25, 0.1]} radius={0.06}><Mat color="#ffffff" /></RoundedBox>
        </Part>
        {[C.blue, C.sun, C.sky].map((c, i) => (
          <Part key={c} p={p} a={0.15 + i * 0.02} b={0.22 + i * 0.02} pos={[-1.75 + i * 0.3, 1.17, 0.2]}>
            <mesh><sphereGeometry args={[0.1, 16, 16]} /><Mat color={c} /></mesh>
          </Part>
        ))}

        {/* Design: the layout slides into place. */}
        <Part p={p} a={0.27} b={0.38} pos={[-0.85, 0.5, 0.26]} from={[-6, 0, 2]}>
          <RoundedBox args={[1.9, 0.34, 0.1]} radius={0.05}><Mat color={C.ink} /></RoundedBox>
        </Part>
        <Part p={p} a={0.31} b={0.42} pos={[-1.05, 0.02, 0.26]} from={[-6, 0, 2]}>
          <RoundedBox args={[1.5, 0.16, 0.08]} radius={0.04}><Mat color="#C9C2B2" /></RoundedBox>
        </Part>
        <Part p={p} a={0.34} b={0.45} pos={[-1.2, -0.3, 0.26]} from={[-6, 0, 2]}>
          <RoundedBox args={[1.2, 0.16, 0.08]} radius={0.04}><Mat color="#C9C2B2" /></RoundedBox>
        </Part>
        <Part p={p} a={0.3} b={0.44} pos={[1.1, -0.2, 0.28]} from={[6, 1, 2]} spin={1.2}>
          <RoundedBox args={[1.35, 1.6, 0.14]} radius={0.1}><Mat color={C.sun} /><Ink /></RoundedBox>
        </Part>
        <Part p={p} a={0.4} b={0.5} pos={[-1.4, -0.85, 0.3]} from={[0, -4, 2]}>
          <RoundedBox args={[0.9, 0.36, 0.14]} radius={0.16}><Mat color={C.blue} /><Ink /></RoundedBox>
        </Part>

        {/* Build: the app, the automation and the till plug in around it. */}
        <Part p={p} a={0.52} b={0.62} pos={[2.9, -0.7, 0.7]} from={[5, -2, 0]} spin={-1}>
          <group scale={0.95}><Phone /></group>
        </Part>
        <Part p={p} a={0.57} b={0.67} pos={[-2.9, 1.1, 0.5]} from={[-5, 3, 0]} spin={1}>
          <group scale={0.8}><Robot /></group>
        </Part>
        <Part p={p} a={0.62} b={0.72} pos={[-2.7, -1.2, 0.6]} from={[-4, -4, 0]} spin={2}>
          <Coin />
        </Part>
        <Part p={p} a={0.66} b={0.76} pos={[2.6, 1.4, 0.4]} from={[4, 4, 0]} spin={-2}>
          <group scale={0.7}><Heart /></group>
        </Part>
      </group>
      <instancedMesh ref={bits} args={[null, null, 90]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.3]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
    </>
  )
}

// A pinned section: scrolling assembles a website in 3D, one project step at a time.
export default function BuildStory({ title = 'How a project runs' }) {
  const root = useRef(null)
  const p = useRef(0)
  const [step, setStep] = useState(0)
  const inView = useInView(root, { margin: '100px' })

  useEffect(() => {
    const read = () => {
      if (!root.current) return
      const r = root.current.getBoundingClientRect()
      p.current = clamp(-r.top / (r.height - innerHeight))
      setStep(Math.min(STEPS.length - 1, Math.floor(p.current * STEPS.length)))
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => {
      removeEventListener('scroll', read)
      removeEventListener('resize', read)
    }
  }, [])

  if (!STEPS.length) return null
  const [name, text] = STEPS[Math.min(step, STEPS.length - 1)]
  return (
    <section id="process" className="story3d" ref={root}>
      <div className="story3d-pin">
        <h2>{title}</h2>
        <div className="story3d-canvas" aria-hidden="true">
          <Canvas flat shadows dpr={[1, 2]} frameloop={inView ? 'always' : 'never'} camera={{ fov: 35, position: [0, 0, 11] }} gl={{ alpha: true }}>
            <Scene p={p} />
          </Canvas>
        </div>
        <div className="story3d-cap" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={name}
              className="step"
              initial={{ y: 30, rotate: 4, opacity: 0 }}
              animate={{ y: 0, rotate: -1.5, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <span className="num bg-sun">{step + 1}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="story3d-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <i key={i} className={i <= step ? 'on' : ''} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
