import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { SERVICES } from '../data.js'
import { openEmailApp, send, validEmail } from '../send.js'
import { play } from '../sound.js'
import { useOrder } from '../ui.jsx'

const BigButton = lazy(() => import('./BigButton.jsx'))

const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

export default function Till() {
  const { picked, toggle } = useOrder()
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle')
  const [note, setNote] = useState('')
  const [burst, setBurst] = useState(0)
  const [coins, setCoins] = useState(0)
  const [paper, animate] = useAnimate()
  const count = useRef(picked.length)
  const emailBox = useRef(null)

  // The paper feeds a notch, and coins hop out, every time a line is added.
  useEffect(() => {
    if (picked.length === count.current) return
    animate(paper.current, { y: [-12, 0] }, { duration: 0.22, ease: 'easeOut' })
    play('print')
    if (picked.length > count.current) setCoins((n) => n + 1)
    count.current = picked.length
    if (state === 'sent') setState('idle')
  }, [picked.length, animate, paper, state])

  const sendOrder = async () => {
    if (state === 'sending') return
    if (!picked.length) return setNote('Press at least one service key first.')
    if (!validEmail(email)) {
      setNote('Enter your email address so we can reply.')
      play('buzz')
      emailBox.current?.focus()
      return
    }
    const subject = 'Order from the website till'
    const message = `Services wanted:\n${picked.map((s) => `- ${s}`).join('\n')}`
    setState('sending')
    setNote('')
    const r = await send(subject, { email, services: picked.join(', '), message })
    if (r.ok) {
      setState('sent')
      setNote(`Order sent. We will reply to ${email}.`)
      setBurst((n) => n + 1)
      play('ding')
    } else if (r.reason === 'nokey') {
      setState('idle')
      setBurst((n) => n + 1)
      play('whoosh')
      setNote('Your email app should open with the order filled in. Press send there to finish.')
      setTimeout(() => openEmailApp(subject, `${message}\n\nReply to: ${email}`), 900)
    } else {
      setState('idle')
      setNote('The order did not send. Check your connection and press the button again.')
      play('buzz')
    }
  }

  return (
    <section id="order" className="till">
      <div className="till-head">
        <h2>Ring up what you need</h2>
        <p>Press the services you're after. The till prints your order, and the big button sends it to us.</p>
        <ul className="keys">
          {SERVICES.map((s) => {
            const on = picked.includes(s)
            return (
              <li key={s}>
                <motion.button
                  type="button"
                  className="key"
                  data-sound="key"
                  aria-pressed={on}
                  onClick={() => toggle(s)}
                  animate={{ y: on ? 5 : 0, boxShadow: on ? '0 2px 0 #0B0E14' : '0 7px 0 #0B0E14' }}
                  whileTap={{ y: 7, boxShadow: '0 0px 0 #0B0E14' }}
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
          <h3>Aknova Tech</h3>
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

        <label className="field till-email">
          <span>Your email, so we can reply</span>
          <input ref={emailBox} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <Suspense fallback={null}>
          <BigButton
            enabled={picked.length > 0 && state !== 'sending'}
            onPress={sendOrder}
            burst={burst}
            coins={coins}
            label={state === 'sending' ? 'Sending' : state === 'sent' ? 'Order sent' : picked.length ? 'Send this order' : 'Pick a service first'}
          />
        </Suspense>
        <p className="till-note" role="status">
          {note}
        </p>
      </div>
    </section>
  )
}
