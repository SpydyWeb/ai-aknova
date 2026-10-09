import { motion, useMotionValue, useSpring } from 'framer-motion'

const soft = { stiffness: 260, damping: 20 }

// Leans its contents toward the pointer in 3D.
export default function Tilt({ as = 'div', max = 14, children, ...rest }) {
  const rx = useSpring(useMotionValue(0), soft)
  const ry = useSpring(useMotionValue(0), soft)
  const Tag = motion[as]
  return (
    <Tag
      {...rest}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, ...rest.style }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - 0.5) * max)
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * max)
      }}
      onPointerLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
    >
      {children}
    </Tag>
  )
}
