import { Outlines, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { C } from '../data.js'

const HALF_PI = Math.PI / 2

// Three flat bands of light, so the toys read as stickers rather than plastic.
export const bands = (() => {
  const t = new THREE.DataTexture(new Uint8Array([165, 225, 255]), 3, 1, THREE.RedFormat)
  t.minFilter = t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()
export const Mat = ({ color }) => <meshToonMaterial color={color} gradientMap={bands} />
export const Ink = () => <Outlines thickness={5} color={C.ink} />

const extrude = (pts, depth) => {
  const s = new THREE.Shape()
  pts(s)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 })
  g.center()
  return g
}
const heartGeo = extrude((s) => {
  s.moveTo(0, -0.7)
  s.bezierCurveTo(-1.3, 0.1, -0.75, 1, 0, 0.42)
  s.bezierCurveTo(0.75, 1, 1.3, 0.1, 0, -0.7)
}, 0.35)
const cursorGeo = extrude((s) => {
  s.moveTo(0, 1)
  ;[[0, -0.7], [0.4, -0.3], [0.7, -0.95], [0.98, -0.82], [0.68, -0.18], [1.2, -0.18]].forEach(([x, y]) => s.lineTo(x, y))
  s.closePath()
}, 0.3)

export const Browser = () => (
  <>
    <RoundedBox args={[2.3, 1.6, 0.36]} radius={0.12}><Mat color={C.grape} /><Ink /></RoundedBox>
    <RoundedBox args={[1.95, 1.0, 0.1]} radius={0.04} position={[0, -0.14, 0.16]}><Mat color="#ffffff" /></RoundedBox>
    {[C.tangerine, C.sun, C.mint].map((c, i) => (
      <mesh key={c} position={[-0.88 + i * 0.22, 0.58, 0.19]}><sphereGeometry args={[0.07, 16, 16]} /><Mat color={c} /></mesh>
    ))}
  </>
)
export const Phone = () => (
  <>
    <RoundedBox args={[1.05, 2, 0.26]} radius={0.12}><Mat color={C.tangerine} /><Ink /></RoundedBox>
    <RoundedBox args={[0.84, 1.62, 0.08]} radius={0.04} position={[0, 0, 0.11]}><Mat color={C.paper} /></RoundedBox>
  </>
)
export const Magnifier = () => (
  <>
    <mesh><torusGeometry args={[0.62, 0.17, 16, 48]} /><Mat color={C.sun} /><Ink /></mesh>
    <mesh rotation={[HALF_PI, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.06, 40]} /><Mat color="#DDF6FF" /></mesh>
    <mesh position={[0.91, -0.91, 0]} rotation={[0, 0, Math.PI / 4]}><cylinderGeometry args={[0.15, 0.15, 1, 20]} /><Mat color={C.tangerine} /><Ink /></mesh>
  </>
)
export const Megaphone = () => (
  <group rotation={[0, 0, -HALF_PI]}>
    <mesh><cylinderGeometry args={[0.28, 0.82, 1.4, 36]} /><Mat color={C.sun} /><Ink /></mesh>
    <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.3, 0.3, 0.32, 24]} /><Mat color={C.grape} /><Ink /></mesh>
  </group>
)
export const Heart = () => (
  <mesh geometry={heartGeo}><Mat color={C.tangerine} /><Ink /></mesh>
)
export const Robot = () => (
  <>
    <RoundedBox args={[1.4, 1.15, 1.1]} radius={0.2}><Mat color={C.mint} /><Ink /></RoundedBox>
    {[-0.32, 0.32].map((x) => (
      <mesh key={x} position={[x, 0.1, 0.56]}><sphereGeometry args={[0.13, 20, 20]} /><Mat color={C.ink} /></mesh>
    ))}
    <mesh position={[0, -0.28, 0.56]}><boxGeometry args={[0.5, 0.09, 0.05]} /><Mat color={C.ink} /></mesh>
    <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[0.045, 0.045, 0.36, 10]} /><Mat color={C.ink} /></mesh>
    <mesh position={[0, 1, 0]}><sphereGeometry args={[0.15, 20, 20]} /><Mat color={C.sun} /><Ink /></mesh>
  </>
)
export const Cursor = () => (
  <mesh geometry={cursorGeo}><Mat color="#ffffff" /><Ink /></mesh>
)
export const Pawn = () => (
  <>
    <mesh position={[0, 0.55, 0]}><sphereGeometry args={[0.38, 28, 28]} /><Mat color={C.grape} /><Ink /></mesh>
    <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.2, 0.56, 0.95, 28]} /><Mat color={C.grape} /><Ink /></mesh>
  </>
)
export const Badge = () => (
  <>
    <RoundedBox args={[1.1, 1.45, 0.18]} radius={0.08}><Mat color={C.sun} /><Ink /></RoundedBox>
    <mesh position={[0, 0.2, 0.1]} rotation={[HALF_PI, 0, 0]}><cylinderGeometry args={[0.26, 0.26, 0.06, 28]} /><Mat color={C.grape} /></mesh>
    {[-0.28, -0.48].map((y, i) => (
      <mesh key={y} position={[0, y, 0.1]}><boxGeometry args={[i ? 0.4 : 0.62, 0.09, 0.04]} /><Mat color={C.ink} /></mesh>
    ))}
    <mesh position={[0, 0.6, 0]}><boxGeometry args={[0.34, 0.09, 0.22]} /><Mat color={C.ink} /></mesh>
  </>
)
export const Coin = () => (
  <>
    <mesh rotation={[HALF_PI, 0, 0]}><cylinderGeometry args={[0.72, 0.72, 0.2, 44]} /><Mat color={C.sun} /><Ink /></mesh>
    <mesh rotation={[HALF_PI, 0, 0]}><cylinderGeometry args={[0.48, 0.48, 0.25, 44]} /><Mat color={C.tangerine} /></mesh>
  </>
)
export const Ball = ({ r, color }) => (
  <mesh><sphereGeometry args={[r, 32, 32]} /><Mat color={color} /><Ink /></mesh>
)

const flapGeo = extrude((s) => {
  s.moveTo(-1, 0.65)
  s.lineTo(1, 0.65)
  s.lineTo(0, -0.1)
  s.closePath()
}, 0.06)
export const Envelope = () => (
  <>
    <RoundedBox args={[2.1, 1.4, 0.22]} radius={0.08}><Mat color={C.sun} /><Ink /></RoundedBox>
    <mesh geometry={flapGeo} position={[0, 0.3, 0.15]}><Mat color={C.tangerine} /><Ink /></mesh>
  </>
)

export const MODELS = {
  'Web development': Browser,
  'UI/UX design': Cursor,
  SEO: Magnifier,
  'Digital marketing': Megaphone,
  'Social media marketing': Heart,
  'Mobile app development': Phone,
  'AI automation': Robot,
  'CRM systems': Pawn,
  'HRM systems': Badge,
  'POS systems': Coin,
}
