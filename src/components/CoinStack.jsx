import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useInView } from 'framer-motion'
import { TOY } from '../data.js'
import { play } from '../sound.js'
import { Mat } from './models.jsx'
import Studio from './Studio.jsx'

const MAX = 8
const THICK = 0.26

// Coins drop one by one and bounce into a stack. `count` is how many land.
function Coins({ count, toss }) {
  const refs = useRef([])
  const state = useRef(Array.from({ length: MAX }, () => ({ y: 8, v: 0, wait: 0 })))
  const spin = useRef(null)

  useEffect(() => {
    state.current.forEach((c, i) => {
      c.y = 5 + i * 0.6
      c.v = 0
      c.wait = i * 0.09
    })
  }, [count, toss])

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    spin.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.5
    state.current.forEach((c, i) => {
      const mesh = refs.current[i]
      if (!mesh) return
      mesh.visible = i < count
      if (i >= count) return
      const rest = -1 + i * THICK
      if (c.wait > 0) c.wait -= dt
      else {
        c.v -= 34 * dt
        c.y += c.v * dt
        if (c.y < rest) {
          c.y = rest
          c.v = Math.abs(c.v) > 1.2 ? -c.v * 0.32 : 0
        }
      }
      mesh.position.y = c.y
    })
  })

  return (
    <group ref={spin} rotation={[0.25, 0, 0.04]}>
      {Array.from({ length: MAX }, (_, i) => (
        <group key={i} ref={(m) => (refs.current[i] = m)}>
          <mesh castShadow>
            <cylinderGeometry args={[1, 1, THICK - 0.03, 48]} />
            <Mat color={TOY.sun} />
          </mesh>
          <mesh position={[0, THICK / 2 - 0.01, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.02, 48]} />
            <Mat color={i % 2 ? TOY.blue : TOY.navy} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Sits beside the pricing switch. Tap it to drop the coins again.
export default function CoinStack({ count }) {
  const box = useRef(null)
  const inView = useInView(box, { margin: '100px' })
  const [toss, setToss] = useState(0)
  return (
    <button
      type="button"
      className="coin-stack"
      ref={box}
      aria-label="Drop the coins again"
      data-cursor="Drop"
      data-sound="coin"
      onClick={() => {
        setToss((n) => n + 1)
        play('coin')
      }}
    >
      <Canvas flat shadows dpr={[1, 2]} frameloop={inView ? 'always' : 'never'} camera={{ fov: 32, position: [0, 2.2, 7.5] }} gl={{ alpha: true }} style={{ pointerEvents: 'none' }}>
        <Studio />
        <Coins count={count} toss={toss} />
      </Canvas>
    </button>
  )
}
