import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'

// Shared lighting for every 3D scene.
// `wall`: depth of an invisible back wall that catches the models' shadows (skipped on phones).
// `sway`: how far the camera drifts with the pointer, which gives the scene real depth.
export default function Studio({ wall, sway = 0 }) {
  const { size, camera } = useThree()
  const shadows = wall !== undefined && size.width >= 520
  const home = useRef(null)
  const look = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!sway) return
    const move = (e) => {
      look.current.x = (e.clientX / innerWidth) * 2 - 1
      look.current.y = (e.clientY / innerHeight) * 2 - 1
    }
    addEventListener('pointermove', move)
    return () => removeEventListener('pointermove', move)
  }, [sway])

  useFrame((_, delta) => {
    if (!sway) return
    home.current ||= { x: camera.position.x, y: camera.position.y }
    const k = Math.min(1, delta * 3)
    camera.position.x += (home.current.x + look.current.x * sway - camera.position.x) * k
    camera.position.y += (home.current.y - look.current.y * sway * 0.6 - camera.position.y) * k
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      {/* Plenty of even light keeps the brand colours saturated; the panels only add highlights. */}
      <ambientLight intensity={0.95} />
      <directionalLight position={[3, 6, 12]} intensity={1.5} castShadow={shadows} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 0.1, 60]} />
      </directionalLight>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#30384a']} />
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 4]} rotation-x={-Math.PI / 3} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#9CCBFF" position={[-7, 1, 3]} rotation-y={Math.PI / 2} scale={[4, 5, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[7, 2, 2]} rotation-y={-Math.PI / 2} scale={[4, 5, 1]} />
      </Environment>
      {shadows && (
        <mesh position={[0, 0, wall]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <shadowMaterial transparent opacity={0.17} />
        </mesh>
      )}
    </>
  )
}
