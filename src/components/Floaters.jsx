import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useInView } from 'framer-motion'
import { shapeFor } from './models.jsx'
import Studio from './Studio.jsx'

// Centre first, then the four corners.
const SPOTS = [
  [0, 0, 0, 1.15],
  [-2.1, 1.15, -1, 0.7],
  [2.1, 1.0, -0.5, 0.72],
  [-1.8, -1.25, 0.3, 0.66],
  [1.9, -1.2, -0.8, 0.7],
]

function Item({ name, spot, unit, index }) {
  const g = useRef(null)
  const turn = useRef(0)
  const rot = useRef(0)
  const grow = useRef(0)
  const Shape = shapeFor(name)
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    // Models arrive one after another.
    if (clock.elapsedTime > index * 0.12) grow.current += (1 - grow.current) * Math.min(1, dt * 7)
    rot.current += (turn.current - rot.current) * Math.min(1, dt * 5)
    g.current.rotation.y = rot.current
    g.current.scale.setScalar(grow.current * spot[3] * unit)
  })
  return (
    <group position={[spot[0] * unit, spot[1] * unit, spot[2]]}>
      <Float speed={1.5 + index * 0.25} rotationIntensity={0.9} floatIntensity={1.3}>
        <group ref={g} onClick={() => (turn.current += Math.PI * 2)}>
          <Shape />
        </group>
      </Float>
    </group>
  )
}

function Cluster({ names }) {
  const { viewport } = useThree()
  const g = useRef(null)
  const look = useRef({ x: 0, y: 0 })
  const unit = Math.min(viewport.width / 6.4, viewport.height / 4.6, 1.25)

  useEffect(() => {
    const move = (e) => {
      look.current.x = (e.clientX / innerWidth) * 2 - 1
      look.current.y = (e.clientY / innerHeight) * 2 - 1
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [])

  // The whole cluster leans toward the pointer and turns as the page scrolls.
  useFrame((_, delta) => {
    const k = Math.min(1, Math.min(delta, 0.05) * 4)
    g.current.rotation.y += (look.current.x * 0.35 + scrollY * 0.0012 - g.current.rotation.y) * k
    g.current.rotation.x += (look.current.y * 0.2 - g.current.rotation.x) * k
  })

  return (
    <group ref={g}>
      {names.slice(0, SPOTS.length).map((n, i) => (
        <Item key={i} name={n} spot={SPOTS[i]} unit={unit} index={i} />
      ))}
    </group>
  )
}

// A loose cluster of floating models for page headers. Tap any of them to spin it.
export default function Floaters({ names }) {
  const box = useRef(null)
  const inView = useInView(box, { margin: '100px' })
  return (
    <div className="floaters" ref={box} data-cursor="Spin">
      <Canvas
        flat
        shadows
        dpr={[1, 2]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 35, position: [0, 0, 9] }}
        gl={{ alpha: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <Studio wall={-2.4} sway={0.5} />
        <Cluster names={names} />
      </Canvas>
    </div>
  )
}
