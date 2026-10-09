import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ModelStage from '../components/ModelStage.jsx'
import NotFound from './NotFound.jsx'
import { SERVICE_INFO, STEPS } from '../data.js'
import { MLink, press, slug, useOrder } from '../ui.jsx'

const SPOT = ['sun', 'mint', 'grape', 'tangerine']

export default function ServiceDetail() {
  const { id } = useParams()
  const { picked, toggle } = useOrder()
  const i = SERVICE_INFO.findIndex((s) => slug(s.name) === id)
  if (i < 0) return <NotFound />

  const s = SERVICE_INFO[i]
  const on = picked.includes(s.name)
  const prev = SERVICE_INFO[(i + SERVICE_INFO.length - 1) % SERVICE_INFO.length]
  const next = SERVICE_INFO[(i + 1) % SERVICE_INFO.length]

  return (
    <>
      <section className="detail">
        <div className="detail-copy">
          <Link className="more" to="/services">
            All services
          </Link>
          <h1>{s.name}</h1>
          <p className="lede">{s.line}</p>
          <h2>What you get</h2>
          <ul className="chips big">
            {s.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="row">
            <motion.button type="button" className={`btn ${on ? 'btn-ink' : 'btn-sun'}`} onClick={() => toggle(s.name)} {...press}>
              {on ? 'Remove from order' : 'Add to order'}
            </motion.button>
            <MLink className="btn btn-tangerine" to="/contact" {...press}>
              Start a project
            </MLink>
          </div>
        </div>
        <div className="svc-panel">
          <ModelStage name={s.name} spot={SPOT[i % 4]} className="tall" />
        </div>
      </section>

      <section className="detail-steps">
        <h2>How it runs</h2>
        <ol>
          {STEPS.map(([name, text], k) => (
            <li key={name}>
              <span className="num bg-sun">{k + 1}</span>
              <div>
                <h3>{name}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <nav className="pager" aria-label="Other services">
        <MLink className="btn btn-paper" to={`/services/${slug(prev.name)}`} {...press}>
          Previous: {prev.name}
        </MLink>
        <MLink className="btn btn-paper" to={`/services/${slug(next.name)}`} {...press}>
          Next: {next.name}
        </MLink>
      </nav>
    </>
  )
}
