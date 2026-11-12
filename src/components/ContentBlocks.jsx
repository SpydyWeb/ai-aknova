// Sections the site owner writes in the admin panel: text, photos, videos, cards and a call to action.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { embedUrl, isVideo } from '../blocks.js'
import { fileAlt, mediaUrl } from '../data.js'
import { MLink, press } from '../ui.jsx'
import Tilt from './Tilt.jsx'
import Rich from './Rich.jsx'

const dark = (tone) => (tone === 'navy' || tone === 'blue' ? 'on-dark' : '')
const outside = (to) => /^(https?:|mailto:|tel:)/.test(to || '')

export function Button({ to, label, className }) {
  if (!label || !to) return null
  return outside(to) ? (
    <motion.a className={className} href={to} target={to.startsWith('http') ? '_blank' : undefined} rel="noreferrer" {...press}>
      {label}
    </motion.a>
  ) : (
    <MLink className={className} to={to} {...press}>
      {label}
    </MLink>
  )
}

function Media({ src, alt, loop = true }) {
  if (!src) return null
  return isVideo(src) ? (
    <video src={mediaUrl(src)} aria-label={alt || fileAlt(src)} autoPlay={loop} muted={loop} loop={loop} controls={!loop} playsInline preload="metadata" />
  ) : (
    <img src={mediaUrl(src)} alt={alt || fileAlt(src)} loading="lazy" />
  )
}

export function TextBlock({ title, body }) {
  return (
    <section className="story">
      {title && <h2>{title}</h2>}
      <Rich text={body} />
    </section>
  )
}

export function SplitBlock({ title, body, media, alt, points, flip, tone = 'paper', buttonLabel, buttonTo }) {
  return (
    <section className={`split bg-${tone} ${dark(tone)} ${flip ? 'flip' : ''}`}>
      <div className="split-copy">
        {title && <h2>{title}</h2>}
        <Rich text={body} />
        {points?.filter(Boolean).length > 0 && (
          <ul className="ticks">
            {points.filter(Boolean).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <Button className={`btn ${tone === 'sun' ? 'btn-ink' : 'btn-sun'}`} to={buttonTo} label={buttonLabel} />
      </div>
      {media && (
        <Tilt className="frame" max={7}>
          <Media src={media} alt={alt || title} />
        </Tilt>
      )}
    </section>
  )
}

export function ImageBlock({ src, alt, caption }) {
  if (!src) return null
  return (
    <section className="photo-block">
      <figure className="frame">
        <img src={mediaUrl(src)} alt={alt || caption || fileAlt(src)} loading="lazy" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </section>
  )
}

export function VideoBlock({ title, src, embed, loop, caption }) {
  const frame = embedUrl(embed)
  if (!src && !frame) return null
  return (
    <section className="photo-block">
      {title && <h2>{title}</h2>}
      <figure className="frame">
        {src ? <Media src={src} alt={title} loop={!!loop} /> : <iframe src={frame} title={title || caption || 'Video'} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </section>
  )
}

const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5]

export function GalleryBlock({ title, images }) {
  const list = (images || []).filter((i) => i?.src)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    if (open === null) return
    const key = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((n) => (n + 1) % list.length)
      if (e.key === 'ArrowLeft') setOpen((n) => (n + list.length - 1) % list.length)
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [open, list.length])

  if (!list.length) return null
  return (
    <section className="gallery">
      {title && <h2>{title}</h2>}
      <ul>
        {list.map((im, i) => (
          <li key={i}>
            <motion.button
              type="button"
              data-cursor="Open"
              data-sound="open"
              aria-label={`Open photo: ${im.alt || i + 1}`}
              style={{ rotate: TILTS[i % 6] }}
              whileHover={{ rotate: 0, x: -3, y: -3 }}
              whileTap={{ x: 4, y: 4 }}
              onClick={() => setOpen(i)}
            >
              <img src={mediaUrl(im.src)} alt={im.alt || (title ? `${title}, photo ${i + 1}` : fileAlt(im.src))} loading="lazy" />
            </motion.button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {open !== null && (
          <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.figure
              className="lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={list[open].alt || 'Photo'}
              initial={{ scale: 0.8, rotate: -3 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={mediaUrl(list[open].src)} alt={list[open].alt || (title ? `${title}, photo ${open + 1}` : fileAlt(list[open].src))} />
              <figcaption>
                <span>{list[open].alt}</span>
                <motion.button type="button" className="btn btn-sun" data-sound="close" autoFocus onClick={() => setOpen(null)} {...press}>
                  Close
                </motion.button>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function CardsBlock({ title, text, cards }) {
  const list = (cards || []).filter((c) => c?.title || c?.text || c?.image)
  if (!list.length && !title) return null
  return (
    <section className="cards-block">
      {title && <h2>{title}</h2>}
      {text && <p className="lede">{text}</p>}
      <ul>
        {list.map((c, i) => {
          const inner = (
            <>
              {c.image && <img src={mediaUrl(c.image)} alt={c.imageAlt || c.title || fileAlt(c.image)} loading="lazy" />}
              {c.title && <h3>{c.title}</h3>}
              {c.text && <p>{c.text}</p>}
            </>
          )
          return (
            <Tilt as="li" key={i} max={8} className={`info-card bg-${c.tone || 'paper'} ${dark(c.tone)}`}>
              {c.to ? outside(c.to) ? <a href={c.to}>{inner}</a> : <Link to={c.to}>{inner}</Link> : <div>{inner}</div>}
            </Tilt>
          )
        })}
      </ul>
    </section>
  )
}

export function CtaBlock({ title, text, tone = 'sun', buttonLabel, buttonTo }) {
  return (
    <section className={`cta-band bg-${tone} ${dark(tone)}`}>
      {title && <h2>{title}</h2>}
      {text && <p>{text}</p>}
      <Button className={`btn ${tone === 'sun' || tone === 'sky' ? 'btn-ink' : 'btn-sun'}`} to={buttonTo} label={buttonLabel} />
    </section>
  )
}
