import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { chime, play, unlock } from '../sound.js'

const HOVERABLE = 'a, button, .svc-card, .post-card, .plan, .note, .why-card, .proj, .card'

// Wires sound to what the visitor does: first touch switches audio on, then clicks, hovers, typing, sections coming into view and page changes all speak. Scrolling
// itself is silent.
export default function SoundScape() {
  const { pathname } = useLocation()
  const pages = useRef(0)

  useEffect(() => {
    const first = () => unlock()
    const opts = { capture: true }
    addEventListener('pointerdown', first, opts)
    addEventListener('keydown', first, opts)

    // Clicks: controls have their own sound; anywhere else plays the next note of a tune.
    const down = (e) => {
      const t = e.target instanceof Element ? e.target : null
      if (!t || t.closest('input, textarea, select')) return
      const control = t.closest('a, button')
      play(control ? control.dataset.sound || 'tap' : 'note')
    }
    addEventListener('pointerdown', down)

    // Hover: one soft tick each time the pointer moves onto a new control or card.
    let last = null
    const over = (e) => {
      if (e.pointerType !== 'mouse') return
      const t = e.target instanceof Element ? e.target.closest(HOVERABLE) : null
      if (t && t !== last) play('hover')
      last = t
    }
    addEventListener('pointerover', over)

    // Typing in a form.
    const typing = (e) => {
      if (e.target instanceof Element && e.target.closest('input, textarea') && e.key.length === 1) play('type')
    }
    addEventListener('keydown', typing)

    return () => {
      removeEventListener('pointerdown', first, opts)
      removeEventListener('keydown', first, opts)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerover', over)
      removeEventListener('keydown', typing)
    }
  }, [])

  // View: each section chimes the first time it scrolls into sight, one note higher than the last.
  useEffect(() => {
    if (pages.current++ > 0) play('page')
    let step = 0
    const seen = new WeakSet()
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting || seen.has(e.target)) return
          seen.add(e.target)
          // The section already on screen when the page opens stays silent.
          if (e.target.dataset.first !== '1') chime(step++)
        }),
      { threshold: 0.3 },
    )
    const timer = setTimeout(() => {
      document.querySelectorAll('main > section, .closing').forEach((el, i) => {
        if (i === 0) el.dataset.first = '1'
        io.observe(el)
      })
    }, 300)
    return () => {
      clearTimeout(timer)
      io.disconnect()
    }
  }, [pathname])

  return null
}
