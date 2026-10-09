import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQS } from '../data.js'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq">
      <h2>Questions people ask first</h2>
      <ul>
        {FAQS.map(([q, a], i) => {
          const on = open === i
          return (
            <li key={q} className={on ? 'on' : ''}>
              <button type="button" aria-expanded={on} aria-controls={`faq-${i}`} onClick={() => setOpen(on ? -1 : i)}>
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
