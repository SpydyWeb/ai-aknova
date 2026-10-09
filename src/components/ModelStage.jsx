import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, PresentationControls } from '@react-three/drei'
import { useInView } from 'framer-motion'
import { MODELS } from './models.jsx'

function Model({ name }) {
  const g = useRef(null)
  const grow = useRef(0)
  const turn = useRef(0)
  const rot = useRef(0)
  const Shape = MODELS[name]

  // Each new model pops in with one full turn.
  useEffect(() => {
    grow.current = 0
    turn.current += Math.PI * 2
  }, [name])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    grow.current += (1 - grow.current) * Math.min(1, dt * 9)
    rot.current += (turn.current - rot.current) * Math.min(1, dt * 5)
    g.current.scale.setScalar(grow.current * 1.3)
    g.current.rotation.y = rot.current
  })

  return (
    <group ref={g} onClick={() => (turn.current += Math.PI * 2)}>
      <Shape />
    </group>
  )
}

// One model on a coloured spot. Drag to turn it, tap to spin it.
export default function ModelStage({ name, spot = 'sun', className = '' }) {
  const stage = useRef(null)
  const inView = useInView(stage, { margin: '200px' })
  return (
    <div className={`svc-stage ${className}`} ref={stage} data-cursor="Spin">
      <span className={`spot bg-${spot}`} />
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ fov: 35, position: [0, 0, 7.5] }}
        gl={{ alpha: true }}
        style={{ touchAction: 'pan-y' }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 8]} intensity={1.9} />
        <PresentationControls snap polar={[-0.6, 0.6]} azimuth={[-1.2, 1.2]} cursor>
          <Float speed={2.2} rotationIntensity={0.5} floatIntensity={0.9}>
            <Model name={name} />
          </Float>
        </PresentationControls>
      </Canvas>
    </div>
  )
}
