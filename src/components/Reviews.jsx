import { useEffect, useRef } from 'react'
import { SITE_INFO } from '../data.js'
import { press } from '../ui.jsx'
import { motion } from 'framer-motion'

// The reviews widget pasted in the admin panel, drawn just above the footer on every page.
// Scripts in pasted HTML do not run on their own, so each one is swapped for a fresh copy.
export default function Reviews() {
  const { title, embed, url } = SITE_INFO.reviews
  const box = useRef(null)

  useEffect(() => {
    const el = box.current
    if (!el || !embed) return
    el.innerHTML = embed
    el.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script')
      for (const a of old.attributes) s.setAttribute(a.name, a.value)
      s.text = old.text
      old.replaceWith(s)
    })
    return () => {
      el.innerHTML = ''
    }
  }, [embed])

  if (!embed && !url) return null
  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div className="reviews-head">
        <h2 id="reviews-title">{title || 'What people say on Google'}</h2>
        {url && (
          <motion.a className="btn btn-paper" href={url} target="_blank" rel="noreferrer" {...press}>
            Read all reviews on Google
          </motion.a>
        )}
      </div>
      {embed && <div className="reviews-embed" ref={box} />}
    </section>
  )
}
