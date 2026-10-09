import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { C } from '../data.js'
import { Ink, Mat } from './models.jsx'

const TIPS = [
  ['Spin a 3D model.', '/services'],
  ['Fling the project cards.', '/#work'],
  ['Ring up an order on the till.', '/contact#order'],
  ['Throw the toys around.', '/'],
]

function Bot({ nudge }) {
  const g = useRef(null)
  const eyes = useRef([])
  const look = useRef({ x: 0, y: 0 })
  const turn = useRef(0)
  const rot = useRef(0)

  useEffect(() => {
    const move = (e) => {
      look.current.x = (e.clientX / innerWidth) * 2 - 2
      look.current.y = (e.clientY / innerHeight) * 2 - 2
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])
  useEffect(() => {
    if (nudge) turn.current += Math.PI * 2
  }, [nudge])

  // Watches the pointer, bobs, blinks, and spins once when tapped.
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    rot.current += (turn.current - rot.current) * Math.min(1, dt * 6)
    g.current.rotation.y += (rot.current + look.current.x * 0.45 - g.current.rotation.y) * Math.min(1, dt * 10)
    g.current.rotation.x += (look.current.y * 0.3 - g.current.rotation.x) * Math.min(1, dt * 10)
    g.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.06 - 0.15
    const blink = clock.elapsedTime % 3.2 < 0.12 ? 0.1 : 1
    eyes.current.forEach((m) => m && (m.scale.y = blink))
  })

  return (
    <group ref={g}>
      <RoundedBox args={[1.4, 1.15, 1.1]} radius={0.2}><Mat color={C.mint} /><Ink /></RoundedBox>
      {[-0.32, 0.32].map((x, i) => (
        <mesh key={x} ref={(m) => (eyes.current[i] = m)} position={[x, 0.1, 0.56]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <Mat color={C.ink} />
        </mesh>
      ))}
      <mesh position={[0, -0.28, 0.56]}><boxGeometry args={[0.5, 0.09, 0.05]} /><Mat color={C.ink} /></mesh>
      <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[0.045, 0.045, 0.36, 10]} /><Mat color={C.ink} /></mesh>
      <mesh position={[0, 1, 0]}><sphereGeometry args={[0.15, 20, 20]} /><Mat color={C.sun} /><Ink /></mesh>
    </group>
  )
}

export default function Buddy() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const [n, setN] = useState(0)
  const tip = n ? TIPS[(n - 1) % TIPS.length] : null

  useEffect(() => {
    if (!n) return
    const t = setTimeout(() => setN(0), 3200)
    return () => clearTimeout(t)
  }, [n])

  if (reduce) return null

  const go = () => {
    navigate(TIPS[n % TIPS.length][1])
    setN((v) => v + 1)
  }

  return (
    <div className="buddy">
      <AnimatePresence>
        {tip && (
          <motion.p
            key={n}
            className="buddy-tip"
            aria-live="polite"
            initial={{ scale: 0, rotate: 8 }}
            animate={{ scale: 1, rotate: -3 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          >
            {tip[0]}
          </motion.p>
        )}
      </AnimatePresence>
      <button type="button" aria-label="Show me something to play with" data-cursor="Tap" onClick={go}>
        <Canvas flat dpr={[1, 2]} camera={{ fov: 35, position: [0, 0, 4.6] }} gl={{ alpha: true }} style={{ pointerEvents: 'none' }}>
          <ambientLight intensity={1.1} />
          <directionalLight position={[4, 6, 8]} intensity={1.9} />
          <Bot nudge={n} />
        </Canvas>
      </button>
    </div>
  )
}
