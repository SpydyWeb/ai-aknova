import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TOY as C } from '../data.js'
import Studio from './Studio.jsx'

const CONFETTI = [C.sun, C.navy, C.sky, '#ffffff']

// A pool of small pieces that can be thrown up from the button and fall under gravity.
function usePieces(count) {
  const mesh = useRef(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () => Array.from({ length: count }, () => ({ p: new THREE.Vector3(0, -99, 0), v: new THREE.Vector3(), r: new THREE.Euler(), s: 0 })),
    [count],
  )
  const throwUp = (n, spread, lift, size) =>
    parts.slice(0, n).forEach((q) => {
      q.p.set(0, 0.9, 0)
      q.v.set((Math.random() - 0.5) * spread, lift + Math.random() * lift, (Math.random() - 0.5) * spread)
      q.s = size * (0.8 + Math.random() * 0.5)
    })
  const step = (dt) => {
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
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }
  return { mesh, parts, throwUp, step }
}

function Scene({ down, enabled, burst, coins }) {
  const cap = useRef(null)
  const bits = usePieces(80)
  const money = usePieces(8)

  useLayoutEffect(() => {
    const c = new THREE.Color()
    bits.parts.forEach((_, i) => bits.mesh.current.setColorAt(i, c.set(CONFETTI[i % 4])))
    bits.mesh.current.instanceColor.needsUpdate = true
  }, [bits.parts, bits.mesh])

  useEffect(() => {
    if (burst) bits.throwUp(80, 7, 5.5, 0.11)
  }, [burst]) // eslint-disable-line react-hooks/exhaustive-deps
  // A few coins hop out each time a service is rung up.
  useEffect(() => {
    if (coins) money.throwUp(4, 3.5, 4, 0.3)
  }, [coins]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    cap.current.position.y += ((down ? 0.3 : 0.62) - cap.current.position.y) * Math.min(1, dt * 28)
    bits.step(dt)
    money.step(dt)
  })

  return (
    <>
      <Studio />
      <mesh>
        <cylinderGeometry args={[1.55, 1.7, 0.55, 56]} />
        <meshPhysicalMaterial color={C.ink} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
      </mesh>
      <mesh ref={cap} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.7, 56]} />
        <meshPhysicalMaterial color={enabled ? C.sun : '#D5DBEA'} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
      </mesh>
      <instancedMesh ref={bits.mesh} args={[null, null, 80]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 0.3]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={money.mesh} args={[null, null, 8]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 0.28, 28]} />
        <meshPhysicalMaterial color={C.sun} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.2} />
      </instancedMesh>
    </>
  )
}

export default function BigButton({ enabled, onPress, burst, coins, label }) {
  const [down, setDown] = useState(false)
  const up = () => setDown(false)
  return (
    <button
      type="button"
      className="big-btn"
      aria-disabled={!enabled}
      data-sound={enabled ? 'tap' : 'buzz'}
      data-cursor={enabled ? 'Press' : undefined}
      onPointerDown={() => setDown(true)}
      onPointerUp={up}
      onPointerLeave={up}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setDown(true)}
      onKeyUp={up}
      onBlur={up}
      onClick={onPress}
    >
      <Canvas flat dpr={[1, 2]} camera={{ fov: 32, position: [0, 3.6, 6] }} gl={{ alpha: true }} style={{ pointerEvents: 'none' }}>
        <Scene down={down && enabled} enabled={enabled} burst={burst} coins={coins} />
      </Canvas>
      <span>{label}</span>
    </button>
  )
}
