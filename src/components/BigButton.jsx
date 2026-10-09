import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import * as THREE from 'three'
import { C } from '../data.js'

const bands = (() => {
  const t = new THREE.DataTexture(new Uint8Array([165, 225, 255]), 3, 1, THREE.RedFormat)
  t.minFilter = t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()
const CONFETTI = [C.sun, C.grape, C.mint, '#ffffff']

function Scene({ down, enabled, burst }) {
  const cap = useRef(null)
  const bits = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () => Array.from({ length: 80 }, () => ({ p: new THREE.Vector3(0, -99, 0), v: new THREE.Vector3(), r: new THREE.Euler(), s: 0 })),
    [],
  )

  useLayoutEffect(() => {
    const c = new THREE.Color()
    parts.forEach((_, i) => bits.current.setColorAt(i, c.set(CONFETTI[i % 4])))
    bits.current.instanceColor.needsUpdate = true
  }, [parts])

  useEffect(() => {
    if (!burst) return
    parts.forEach((q) => {
      q.p.set(0, 0.9, 0)
      q.v.set((Math.random() - 0.5) * 7, 5 + Math.random() * 6, (Math.random() - 0.5) * 7)
      q.s = 0.1 + Math.random() * 0.12
    })
  }, [burst, parts])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    cap.current.position.y += ((down ? 0.3 : 0.62) - cap.current.position.y) * Math.min(1, dt * 28)
    parts.forEach((q, i) => {
      if (q.p.y > -20) {
        q.v.y -= 18 * dt
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
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 6, 5]} intensity={1.9} />
      <mesh>
        <cylinderGeometry args={[1.55, 1.7, 0.55, 56]} />
        <meshToonMaterial color={C.ink} gradientMap={bands} />
      </mesh>
      <mesh ref={cap} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.7, 56]} />
        <meshToonMaterial color={enabled ? C.sun : '#E3D8BD'} gradientMap={bands} />
        <Outlines thickness={5} color={C.ink} />
      </mesh>
      <instancedMesh ref={bits} args={[null, null, 80]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.3]} />
        <meshBasicMaterial />
      </instancedMesh>
    </>
  )
}

export default function BigButton({ enabled, onPress, burst }) {
  const [down, setDown] = useState(false)
  const up = () => setDown(false)
  return (
    <button
      type="button"
      className="big-btn"
      aria-disabled={!enabled}
      onPointerDown={() => setDown(true)}
      onPointerUp={up}
      onPointerLeave={up}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setDown(true)}
      onKeyUp={up}
      onBlur={up}
      onClick={onPress}
    >
      <Canvas flat dpr={[1, 2]} camera={{ fov: 32, position: [0, 3.6, 6] }} gl={{ alpha: true }} style={{ pointerEvents: 'none' }}>
        <Scene down={down && enabled} enabled={enabled} burst={burst} />
      </Canvas>
      <span>{enabled ? 'Email this order' : 'Pick a service first'}</span>
    </button>
  )
}
