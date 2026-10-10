import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '../components/PageHero.jsx'
import { PROJECTS } from '../data.js'
import { press } from '../ui.jsx'

const SKINS = ['sun', 'blue', 'paper', 'sky']
const BLOCK = ['navy', 'ink', 'blue', 'navy']
const GROUPS = {
  All: () => true,
  Websites: (t) => /web|ui/i.test(t),
  Apps: (t) => /app/i.test(t),
  Marketing: (t) => /seo|marketing/i.test(t),
  'Business software': (t) => /crm|hrm|pos|automation/i.test(t),
}

export default function WorkPage() {
  const [group, setGroup] = useState('All')
  const [open, setOpen] = useState(null)
  const list = PROJECTS.map((p, i) => ({ ...p, i })).filter((p) => GROUPS[group](p.type))

  useEffect(() => {
    if (open === null) return
    const esc = (e) => e.key === 'Escape' && setOpen(null)
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [open])

  return (
    <>
      <PageHero
        tone="navy"
        title="Ten projects we're proud of"
        text="Filter by the kind of work, then tap a project to open it."
        models={['Web development', 'Mobile app development', 'Social media marketing', 'UI/UX design', 'CRM systems']}
      />
      <section className="work-all">
        <div className="filters" role="group" aria-label="Filter projects">
          {Object.keys(GROUPS).map((g) => (
            <motion.button key={g} type="button" className={`btn ${g === group ? 'btn-ink' : 'btn-paper'}`} aria-pressed={g === group} onClick={() => setGroup(g)} {...press}>
              {g}
            </motion.button>
          ))}
        </div>

        <ul className="work-grid">
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <motion.li
                key={p.name}
                layout
                initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.6, opacity: 0, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <motion.button
                  type="button"
                  className={`proj bg-${SKINS[p.i % 4]}`}
                  data-cursor="Open"
                  onClick={() => setOpen(p.i)}
                  whileHover={{ x: -3, y: -3, rotate: p.i % 2 ? 1 : -1 }}
                  whileTap={{ x: 4, y: 4 }}
                >
                  <span className={`shot ${p.i % 2 ? 'flip' : ''}`}>
                    <i className={`bg-${BLOCK[p.i % 4]}`} />
                    <span>
                      <b />
                      <b />
                      <b />
                      <em />
                    </span>
                  </span>
                  <strong>{p.name}</strong>
                  <span className="meta">
                    <span>{p.type}</span>
                    <span>Sample</span>
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <AnimatePresence>
        {open !== null && (
          <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.div
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={PROJECTS[open].name}
              initial={{ y: 80, rotate: -5, scale: 0.8 }}
              animate={{ y: 0, rotate: -1, scale: 1 }}
              exit={{ y: 80, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{PROJECTS[open].name}</h2>
              <p className="type">{PROJECTS[open].type}</p>
              <p>{PROJECTS[open].blurb}</p>
              <p className="link">Your live link goes here</p>
              <motion.button type="button" className="btn btn-sun" autoFocus onClick={() => setOpen(null)} {...press}>
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
