import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQS } from '../data.js'
import Clip from './Clip.jsx'
import Tilt from './Tilt.jsx'

export default function Faq({ title = 'Questions people ask first', video }) {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq">
      <h2>{title}</h2>
      <Tilt className="faq-video" max={8}>
        <Clip file={video} label="A short video about how we work" />
      </Tilt>
      <ul>
        {FAQS.map(([q, a], i) => {
          const on = open === i
          return (
            <li key={i} className={on ? 'on' : ''}>
              <button type="button" data-sound={on ? 'close' : 'open'} aria-expanded={on} aria-controls={`faq-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                <span>{q}</span>
                <motion.i animate={{ rotate: on ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div
                    id={`faq-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <p>{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
