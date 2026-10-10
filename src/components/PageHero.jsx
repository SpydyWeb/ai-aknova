import { useReducedMotion } from 'framer-motion'
import Floaters from './Floaters.jsx'

// Shared header for inner pages: words on one side, floating models on the other.
export default function PageHero({ title, text, models, tone = 'paper', children }) {
  const reduce = useReducedMotion()
  return (
    <section className={`page-hero bg-${tone} ${tone === 'navy' ? 'on-dark' : ''}`}>
      <div className="page-hero-copy">
        <h1>{title}</h1>
        {text && <p className="lede">{text}</p>}
        {children}
      </div>
      {!reduce && <Floaters names={models} />}
    </section>
  )
}
