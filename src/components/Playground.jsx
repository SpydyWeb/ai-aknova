import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BallCollider, CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { C } from '../data.js'
import { Ball, MODELS } from './models.jsx'

const FOV = 35
const HALF_PI = Math.PI / 2

const COLLIDERS = {
  'Web development': <CuboidCollider args={[1.15, 0.8, 0.18]} />,
  'Mobile app development': <CuboidCollider args={[0.525, 1, 0.13]} />,
  'AI automation': (
    <>
      <CuboidCollider args={[0.7, 0.575, 0.55]} />
      <BallCollider args={[0.15]} position={[0, 1, 0]} />
    </>
  ),
  SEO: (
    <>
      <CylinderCollider args={[0.17, 0.79]} rotation={[HALF_PI, 0, 0]} />
      <CuboidCollider args={[0.15, 0.5, 0.15]} position={[0.91, -0.91, 0]} rotation={[0, 0, Math.PI / 4]} />
    </>
  ),
  'Social media marketing': <BallCollider args={[0.66]} />,
  'POS systems': <CylinderCollider args={[0.1, 0.72]} rotation={[HALF_PI, 0, 0]} />,
  'UI/UX design': <CuboidCollider args={[0.55, 0.92, 0.18]} />,
  'Digital marketing': <CylinderCollider args={[0.85, 0.62]} position={[0.1, 0, 0]} rotation={[0, 0, -HALF_PI]} />,
  'CRM systems': (
    <>
      <BallCollider args={[0.38]} position={[0, 0.55, 0]} />
      <CylinderCollider args={[0.47, 0.45]} position={[0, -0.2, 0]} />
    </>
  ),
  'HRM systems': <CuboidCollider args={[0.55, 0.725, 0.09]} />,
}

// Order matters: narrow screens only get the first few.
const TOYS = [
  ...Object.keys(COLLIDERS).map((name) => {
    const Model = MODELS[name]
    return [name, <><Model />{COLLIDERS[name]}</>]
  }),
  [null, <><Ball r={0.5} color={C.mint} /><BallCollider args={[0.5]} /></>],
  [null, <><Ball r={0.34} color={C.grape} /><BallCollider args={[0.34]} /></>],
]

function useWorld() {
  const { size, camera } = useThree()
  return useMemo(() => {
    const aspect = size.width / size.height
    const z = aspect < 1 ? 22 : aspect < 1.45 ? 19 : 15
    const h = 2 * z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    camera.position.z = z
    camera.updateProjectionMatrix()
    return { w: h * aspect, h, count: aspect < 1 ? 7 : aspect < 1.45 ? 9 : 12 }
  }, [size, camera])
}

function Toy({ name, index, world, drag, onPop, children }) {
  const body = useRef(null)
  const [start] = useState(() => ({
    p: [(Math.random() - 0.5) * Math.max(1, world.w - 3.5), world.h / 2 + 1.5 + index * 1.3, 0],
    r: [0, 0, Math.random() * 3],
  }))
  // A resize can move the walls past a toy; drop any stray back in from the top.
  useFrame(() => {
    const b = body.current
    if (!b) return
    const p = b.translation()
    if (p.y > -world.h / 2 - 2 && Math.abs(p.x) < world.w / 2 + 2) return
    b.setTranslation({ x: (Math.random() - 0.5) * Math.max(1, world.w - 3.5), y: world.h / 2 + 2, z: 0 }, true)
    b.setLinvel({ x: 0, y: 0, z: 0 }, true)
  })
  const hover = (v) => {
    if (drag.current) return
    document.body.style.cursor = v ? 'grab' : ''
    if (v) document.body.dataset.cursor = 'Throw'
    else delete document.body.dataset.cursor
  }
  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={start.p}
      rotation={start.r}
      restitution={0.35}
      friction={0.6}
      linearDamping={0.15}
      angularDamping={0.5}
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
    >
      <group
        onPointerDown={(e) => {
          e.stopPropagation()
          drag.current = body.current
          document.body.style.cursor = 'grabbing'
        }}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
        onClick={(e) => {
          if (e.delta > 8) return
          body.current.setLinvel({ x: (Math.random() - 0.5) * 8, y: 14, z: 0 }, true)
          body.current.setAngvel({ x: 0, y: 0, z: Math.random() * 16 - 8 }, true)
          if (name) onPop(name)
        }}
      >
        {children}
      </group>
    </RigidBody>
  )
}

function Scene({ onPop }) {
  const world = useWorld()
  const drag = useRef(null)
  const toys = TOYS.slice(0, world.count)

  useEffect(() => {
    const drop = () => {
      drag.current = null
      document.body.style.cursor = ''
      delete document.body.dataset.cursor
    }
    addEventListener('pointerup', drop)
    addEventListener('pointercancel', drop)
    return () => {
      removeEventListener('pointerup', drop)
      removeEventListener('pointercancel', drop)
    }
  }, [])

  useFrame(({ pointer }) => {
    const b = drag.current
    if (!b) return
    const p = b.translation()
    let vx = ((pointer.x * world.w) / 2 - p.x) * 14
    let vy = ((pointer.y * world.h) / 2 - p.y) * 14
    const m = Math.hypot(vx, vy)
    if (m > 48) {
      vx *= 48 / m
      vy *= 48 / m
    }
    b.setLinvel({ x: vx, y: vy, z: 0 }, true)
  })

  const { w, h } = world
  return (
    <>
      <RigidBody type="fixed" colliders={false} key={`${w.toFixed(2)}x${h.toFixed(2)}`}>
        <CuboidCollider args={[w, 1, 4]} position={[0, -h / 2 - 0.85, 0]} />
        <CuboidCollider args={[1, h * 3, 4]} position={[-w / 2 - 1, h, 0]} />
        <CuboidCollider args={[1, h * 3, 4]} position={[w / 2 + 1, h, 0]} />
        <CuboidCollider args={[w, 1, 4]} position={[0, h / 2 + 24, 0]} />
      </RigidBody>
      {toys.map(([name, el], i) => (
        <Toy key={i} name={name} index={i} world={world} drag={drag} onPop={onPop}>
          {el}
        </Toy>
      ))}
    </>
  )
}

export default function Playground({ active, onPop }) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: FOV, position: [0, 0, 15] }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'pan-y' }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 8]} intensity={1.9} />
      <Physics gravity={[0, -28, 0]} paused={!active}>
        <Scene onPop={onPop} />
      </Physics>
    </Canvas>
  )
}
