import { useEffect, useRef, useState } from 'react'
import { Canvas as FiberCanvas } from '@react-three/fiber'

// Every 3D scene on the site goes through this, so all of them share three safety rules:
// 1. Shaders are not checked for errors. That check makes the page wait for the graphics card to
//    finish compiling, which froze the page for half a second per scene on slower machines.
// 2. Weak graphics (integrated chips, software rendering, low-memory devices) get no shadows,
//    no edge smoothing and 1x pixels.
// 3. If the graphics card resets ("context lost"), every scene on the page is removed instead of
//    retrying, because retrying is what left Chrome saying the page was not responding.

const nav = typeof navigator === 'undefined' ? {} : navigator
let weak = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4
let lost = false
const onLost = new Set()

const WEAK_GPU = /intel|uhd|iris|swiftshader|llvmpipe|basic render|software|mali-[gt]\d|adreno \(tm\) [1-5]/i
function gpuName(gl) {
  try {
    const ctx = gl.getContext()
    const info = ctx.getExtension('WEBGL_debug_renderer_info')
    return String(ctx.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : ctx.RENDERER) || '')
  } catch {
    return ''
  }
}

export default function Canvas({ dpr = [1, 1.5], shadows, gl, onCreated, ...props }) {
  const [, redraw] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    const f = () => redraw((n) => n + 1)
    onLost.add(f)
    return () => {
      // A scene closing on purpose also drops its context; that must not count as a reset.
      alive.current = false
      onLost.delete(f)
    }
  }, [])

  if (lost) return null
  return (
    <FiberCanvas
      {...props}
      dpr={weak ? 1 : dpr}
      shadows={weak ? false : shadows}
      gl={{ powerPreference: 'high-performance', ...gl, ...(weak ? { antialias: false } : {}) }}
      onCreated={(state) => {
        state.gl.debug.checkShaderErrors = false
        if (!weak && WEAK_GPU.test(gpuName(state.gl))) {
          // Found out from this scene; every scene built after it starts light.
          weak = true
          state.setDpr(1)
          state.gl.shadowMap.enabled = false
        }
        state.gl.domElement.addEventListener('webglcontextlost', () => {
          if (!alive.current || lost) return
          lost = true
          onLost.forEach((f) => f())
        })
        onCreated?.(state)
      }}
    />
  )
}
