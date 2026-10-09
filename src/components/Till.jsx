import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { EMAIL, SERVICES } from '../data.js'
import { useOrder } from '../ui.jsx'

const BigButton = lazy(() => import('./BigButton.jsx'))

const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

export default function Till() {
  const { picked, toggle } = useOrder()
  const [sent, setSent] = useState(0)
  const [paper, animate] = useAnimate()

  // The paper feeds a notch every time a line is added or removed.
  useEffect(() => {
    animate(paper.current, { y: [-12, 0] }, { duration: 0.22, ease: 'easeOut' })
  }, [picked.length, animate, paper])

  const send = () => {
    if (!picked.length) return
    setSent((n) => n + 1)
    const body = `Hi Anova AI,\n\nI would like to talk about:\n${picked.map((s) => `- ${s}`).join('\n')}\n\nAbout my business:\n`
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent('Project order from your website')}&body=${encodeURIComponent(body)}`
    setTimeout(() => (window.location.href = href), 900)
  }

  return (
    <section id="order" className="till">
      <div className="till-head">
        <h2>Ring up what you need</h2>
        <p>Press the services you're after. The till prints your order, and the big button emails it to us.</p>
        <ul className="keys">
          {SERVICES.map((s) => {
            const on = picked.includes(s)
            return (
              <li key={s}>
                <motion.button
                  type="button"
                  className="key"
                  aria-pressed={on}
                  onClick={() => toggle(s)}
                  animate={{ y: on ? 5 : 0, boxShadow: on ? '0 2px 0 #17130E' : '0 7px 0 #17130E' }}
                  whileTap={{ y: 7, boxShadow: '0 0px 0 #17130E' }}
                  transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                >
                  {s}
                </motion.button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="printer">
        <div className="slot" />
        <div className="paper" ref={paper}>
          <h3>Anova AI</h3>
          <p className="date">{today}</p>
          <hr />
          <ul aria-live="polite">
            <AnimatePresence initial={false}>
              {picked.map((s) => (
                <motion.li
                  key={s}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <span>{s}</span>
                  <span>1</span>
                </motion.li>
              ))}
            </AnimatePresence>
            {!picked.length && <li className="empty">Nothing rung up yet. Press a key.</li>}
          </ul>
          <hr />
          <p className="total">
            <span>Items</span>
            <span>{picked.length}</span>
          </p>
          <p className="total">
            <span>Total</span>
            <span>one conversation</span>
          </p>
        </div>
        <Suspense fallback={null}>
          <BigButton enabled={picked.length > 0} onPress={send} burst={sent} />
        </Suspense>
      </div>
    </section>
  )
}
