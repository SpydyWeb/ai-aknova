import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MLink, press, useOrder } from '../ui.jsx'
import { setSound, soundOn } from '../sound.js'

const LINKS = [
  ['/services', 'Services'],
  ['/work', 'Work'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { picked } = useOrder()
  const [sound, setSoundState] = useState(soundOn)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [open])

  return (
    <header className="nav">
      <Link className="logo" to="/">
        <span className="logo-mark" aria-hidden="true" />
        Anova AI
      </Link>

      <nav className="nav-wide">
        {LINKS.slice(0, 3).map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
        <MLink className="btn btn-ink" to="/contact" {...press}>
          Start a project{picked.length ? ` (${picked.length})` : ''}
        </MLink>
      </nav>

      <button
        type="button"
        className="sound-btn"
        aria-pressed={sound}
        onClick={() => {
          setSound(!sound)
          setSoundState(!sound)
        }}
      >
        Sound {sound ? 'on' : 'off'}
      </button>

      <button type="button" className="burger" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((v) => !v)}>
        <span className="sr">{open ? 'Close menu' : 'Open menu'}</span>
        <motion.i animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} />
        <motion.i animate={{ opacity: open ? 0 : 1 }} />
        <motion.i animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="menu"
            className="menu"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            {[['/', 'Home'], ...LINKS].map(([to, label], i) => (
              <motion.div
                key={to}
                initial={{ x: -40, opacity: 0, rotate: -4 }}
                animate={{ x: 0, opacity: 1, rotate: i % 2 ? 1.5 : -1.5 }}
                transition={{ delay: 0.08 + i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <NavLink to={to} end>
                  {label}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
