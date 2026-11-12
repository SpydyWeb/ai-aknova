// Sections a service page is built from. Each one also works on any other page.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { paragraphs } from '../blocks.js'
import { INDUSTRIES, PROJECTS, STEPS, mediaUrl } from '../data.js'
import { MLink, press, useOrder } from '../ui.jsx'
import { Button } from './ContentBlocks.jsx'
import ModelStage from './ModelStage.jsx'

const dark = (tone) => (tone === 'navy' || tone === 'blue' ? 'on-dark' : '')
const outside = (to) => /^(https?:|mailto:|tel:)/.test(to || '')

function Head({ title, text }) {
  if (!title && !text) return null
  return (
    <div className="blk-head">
      {title && <h2>{title}</h2>}
      {text && <p>{text}</p>}
    </div>
  )
}

export function SvcHero({ owner: service, title, highlight, tone = 'sun', text, ticks, image, primaryLabel, primaryTo, secondaryLabel, secondaryTo }) {
  const { picked, toggle } = useOrder()
  const on = service && picked.includes(service.name)
  const list = (ticks || []).filter(Boolean)
  return (
    <section className="detail svc-hero">
      <div className="detail-copy">
        {service && (
          <Link className="more" to="/services">
            All services
          </Link>
        )}
        <h1>
          {title || service?.name}
          {highlight && (
            <span className="chip-line">
              <span className={`chip bg-${tone}`}>{highlight}</span>
            </span>
          )}
        </h1>
        {text && <p className="lede">{text}</p>}
        <div className="row">
          <Button className="btn btn-blue" to={primaryTo || '/contact'} label={primaryLabel} />
          {service && (
            <motion.button type="button" className={`btn ${on ? 'btn-ink' : 'btn-sun'}`} onClick={() => toggle(service.name)} {...press}>
              {on ? 'Remove from order' : 'Add to order'}
            </motion.button>
          )}
          <Button className="btn btn-paper" to={secondaryTo} label={secondaryLabel} />
        </div>
        {list.length > 0 && (
          <ul className="ticks">
            {list.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="svc-panel">
        {image ? (
          <div className="svc-stage tall svc-photo">
            <img src={mediaUrl(image)} alt={title || service?.name || ''} />
          </div>
        ) : (
          <ModelStage name={service?.name || title} spot={tone} className="tall" />
        )}
      </div>
    </section>
  )
}

export function Intro({ title, body, tone = 'paper' }) {
  return (
    <section className={`intro bg-${tone} ${dark(tone)}`}>
      {title && <h2>{title}</h2>}
      <div>
        {paragraphs(body).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
    </section>
  )
}

export function Features({ title, text, tone = 'paper', look = 'cards', items, buttonLabel, buttonTo }) {
  const list = (items || []).filter((x) => x?.title)
  if (!list.length && !title) return null
  return (
    <section className={`feat feat-${look} bg-${tone} ${dark(tone)}`}>
      <Head title={title} text={text} />
      {/* Three or four across, whichever leaves no half-empty last row. */}
      <ul style={{ '--cols': list.length % 4 && !(list.length % 3) ? 3 : 4 }}>
        {list.map((x, i) => {
          const inner = (
            <>
              <h3>{x.title}</h3>
              {x.text && <p>{x.text}</p>}
            </>
          )
          return (
            <li key={i}>
              {x.to ? (
                outside(x.to) ? (
                  <a href={x.to} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <Link to={x.to}>{inner}</Link>
                )
              ) : (
                inner
              )}
            </li>
          )
        })}
      </ul>
      <Button className={`btn ${dark(tone) ? 'btn-sun' : 'btn-blue'}`} to={buttonTo} label={buttonLabel} />
    </section>
  )
}

export function Timeline({ title, text, tone = 'navy', steps }) {
  const own = (steps || []).filter((s) => s?.title)
  const list = own.length ? own.map((s) => [s.title, s.text]) : STEPS
  return (
    <section className={`timeline bg-${tone} ${dark(tone)}`}>
      <Head title={title} text={text} />
      <ol>
        {list.map(([name, t], i) => (
          <li key={i}>
            <span className="num bg-sun">{i + 1}</span>
            <h3>{name}</h3>
            {t && <p>{t}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

const SKINS = ['sun', 'blue', 'paper', 'sky']
const BLOCK = ['navy', 'ink', 'blue', 'navy']

// Projects of one kind of work: the one picked in the admin, or the service whose page this is.
export function Projects({ owner, service, title, text, max = 3 }) {
  const want = service || owner?.name
  const all = PROJECTS.map((p, i) => ({ ...p, i }))
  const mine = want ? all.filter((p) => p.type === want) : all
  const list = (mine.length ? mine : all).slice(0, Number(max) || 3)
  if (!list.length) return null
  return (
    <section className="proj-block">
      <Head title={title} text={text} />
      <ul className="work-grid">
        {list.map((p) => (
          <li key={p.i}>
            <article className={`proj proj-card bg-${SKINS[p.i % 4]}`}>
              {p.image ? (
                <span className="shot photo">
                  <img src={mediaUrl(p.image)} alt="" loading="lazy" />
                </span>
              ) : (
                <span className={`shot ${p.i % 2 ? 'flip' : ''}`} aria-hidden="true">
                  <i className={`bg-${BLOCK[p.i % 4]}`} />
                  <span>
                    <b />
                    <b />
                    <b />
                    <em />
                  </span>
                </span>
              )}
              <span className="meta">
                <span>{p.type}</span>
                {p.tag && <span>{p.tag}</span>}
              </span>
              <h3>{p.name}</h3>
              {p.blurb && <p>{p.blurb}</p>}
              {p.link && (
                <a className="more" href={p.link} target="_blank" rel="noreferrer">
                  Visit {p.name}
                </a>
              )}
            </article>
          </li>
        ))}
      </ul>
      <MLink className="btn btn-paper" to="/work" {...press}>
        See all our work
      </MLink>
    </section>
  )
}

const STICKERS = ['sun', 'sky', 'paper', 'blue', 'paper', 'sun', 'navy', 'sky']
const TURNS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5]

// Every industry as a sticker on a wall.
export function Industries({ title, text }) {
  if (!INDUSTRIES.length) return null
  return (
    <section className="industries">
      <Head title={title} text={text} />
      <ul>
        {INDUSTRIES.map((x, i) => (
          <li key={i} className={`bg-${STICKERS[i % 8]} ${dark(STICKERS[i % 8])}`} style={{ rotate: `${TURNS[i % 8]}deg` }}>
            {x.image && <img src={mediaUrl(x.image)} alt="" loading="lazy" />}
            <span>
              <strong>{x.name}</strong>
              {x.text && <small>{x.text}</small>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// The FAQ look, with questions written for this page.
export function Questions({ title, text, items }) {
  const list = (items || []).filter((x) => x?.q)
  const [open, setOpen] = useState(0)
  if (!list.length) return null
  return (
    <section className="faq qa">
      {title && <h2>{title}</h2>}
      {text && <p className="qa-text">{text}</p>}
      <ul>
        {list.map(({ q, a }, i) => {
          const on = open === i
          return (
            <li key={i} className={on ? 'on' : ''}>
              <button type="button" data-sound={on ? 'close' : 'open'} aria-expanded={on} aria-controls={`qa-${i}`} onClick={() => setOpen(on ? -1 : i)}>
                <span>{q}</span>
                <motion.i animate={{ rotate: on ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div id={`qa-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
                    {paragraphs(a).map((t, k) => (
                      <p key={k}>{t}</p>
                    ))}
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
