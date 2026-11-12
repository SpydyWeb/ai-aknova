// Form fields for the admin panel. A screen describes what it edits as a list of field
// definitions (see schema.js and ../blocks.js) and <Fields> draws the form.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { BLOCKS, isVideo } from '../blocks.js'
import { mediaUrl, slug } from '../data.js'
import { api } from './api.js'

// Gives fields the whole site content (for lists of services and pages) and a way to open the media library.
export const AdminContext = createContext({ doc: {}, pickMedia: async () => null, me: {} })

export const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// Closes a dialog on Escape, unless the media picker is open on top of it.
function useEscape(close) {
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && !document.querySelector('.adm-modal') && close()
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [close])
}

/* ---------- sections of a page: the same picker for pages and service pages ---------- */
function AddSection({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const close = useCallback(() => (setOpen(false), setQ('')), [])
  if (!open)
    return (
      <button type="button" className="adm-btn primary" onClick={() => setOpen(true)}>
        Add a section
      </button>
    )
  const find = q.trim().toLowerCase()
  const groups = ['Write your own', 'Ready-made'].map((group) => [group, Object.entries(BLOCKS).filter(([, b]) => b.group === group && (!find || `${b.label} ${b.about}`.toLowerCase().includes(find)))])
  return (
    <div className="adm-sheet-back" onClick={close}>
      <div className="adm-picker" role="dialog" aria-modal="true" aria-labelledby="adm-pick-h" onClick={(e) => e.stopPropagation()}>
        <Esc close={close} />
        <div className="adm-add-head">
          <h3 id="adm-pick-h">Add a section</h3>
          <button type="button" className="adm-btn" onClick={close}>
            Cancel
          </button>
        </div>
        <input type="search" autoFocus aria-label="Find a section" placeholder="Find a section, for example photo or button" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="adm-picker-list">
          {groups.map(([group, list]) =>
            list.length ? (
              <div key={group} className="adm-add">
                <h4>{group === 'Ready-made' ? 'Ready-made: fills itself from your other screens' : 'Write your own'}</h4>
                <ul>
                  {list.map(([type, b]) => (
                    <li key={type}>
                      <button
                        type="button"
                        onClick={() => {
                          onAdd({ id: newId(), type, ...structuredClone(b.blank) })
                          close()
                        }}
                      >
                        <strong>{b.label}</strong>
                        <span>{b.about}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {groups.every(([, list]) => !list.length) && <p className="adm-empty">No section matches &ldquo;{q}&rdquo;. Try a shorter word.</p>}
        </div>
      </div>
    </div>
  )
}
function Esc({ close }) {
  useEscape(close)
  return null
}

export const SECTIONS = {
  noun: 'section',
  sheet: true,
  name: (b) => b.title || b.before || BLOCKS[b.type]?.label || b.type,
  badge: (b) => ((b.title || b.before) && (b.title || b.before) !== BLOCKS[b.type]?.label ? BLOCKS[b.type]?.label : ''),
  about: (b) => BLOCKS[b.type]?.about,
  of: (b) => BLOCKS[b.type]?.fields || [],
  adder: (add) => <AddSection onAdd={add} />,
}

export const move = (list, from, to) => {
  const next = [...list]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

// A delete button that asks once more before it acts.
export function Danger({ label = 'Delete', sure = 'Really delete?', onConfirm, className = '' }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={`adm-btn danger ${armed ? 'armed' : ''} ${className}`} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? sure : label}
    </button>
  )
}

const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function Thumb({ url }) {
  if (!url) return <span className="adm-thumb empty" />
  if (isVideo(url)) return <video className="adm-thumb" src={url} muted preload="metadata" />
  if (/\.pdf$/i.test(url)) return <span className="adm-thumb doc">PDF</span>
  return <img className="adm-thumb" src={url} alt="" loading="lazy" />
}

/* ---------- the media library: every uploaded photo and video ---------- */
export function MediaLibrary({ kind = 'any', onPick }) {
  const { doc, me } = useContext(AdminContext)
  const limit = me?.maxUpload || 300 * 1048576
  const [files, setFiles] = useState(null)
  const [busy, setBusy] = useState([])
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [copied, setCopied] = useState('')
  const input = useRef(null)
  const used = JSON.stringify(doc)

  const load = () => api.media().then(setFiles, (e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const add = async (list) => {
    setError('')
    for (const file of list) {
      if (file.size > limit) {
        setError(`${file.name} is ${size(file.size)}. The limit here is ${size(limit)}. For a video, upload it to YouTube or Vimeo and use a Video section with the link.`)
        continue
      }
      setBusy((b) => [...b, { name: file.name, done: 0 }])
      try {
        await api.upload(file, (done) => setBusy((b) => b.map((x) => (x.name === file.name ? { ...x, done } : x))))
      } catch (e) {
        setError(e.message)
      }
      setBusy((b) => b.filter((x) => x.name !== file.name))
      await load()
    }
  }
  const remove = async (f) => {
    try {
      await api.removeMedia(f.name)
      load()
    } catch (e) {
      setError(e.message)
    }
  }
  const copy = (url) => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(url)
      setTimeout(() => setCopied(''), 1600)
    })
  }

  const shown = (files || []).filter((f) => kind === 'any' || f.type === kind)
  const accept = kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : 'image/*,video/*,application/pdf'

  return (
    <div
      className={`adm-library ${over ? 'over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        add([...e.dataTransfer.files])
      }}
    >
      <div className="adm-drop">
        <p>
          <strong>Drop files here</strong>, or choose them from your computer. Photos (JPG, PNG, WebP, GIF, SVG), videos (MP4, WebM, MOV) and PDFs, up to {size(limit)} each.{me?.remote ? ' Each upload appears on the live site about a minute later.' : ''}
        </p>
        <button type="button" className="adm-btn primary" onClick={() => input.current.click()}>
          Upload files
        </button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={accept}
          onChange={(e) => {
            add([...e.target.files])
            e.target.value = ''
          }}
        />
      </div>
      {busy.map((b) => (
        <p key={b.name} className="adm-progress">
          <span style={{ width: `${Math.round(b.done * 100)}%` }} />
          <em>
            Uploading {b.name}, {Math.round(b.done * 100)}%
          </em>
        </p>
      ))}
      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}
      {files && !shown.length && !busy.length && <p className="adm-empty">Nothing uploaded yet. Add your first {kind === 'video' ? 'video' : kind === 'image' ? 'photo' : 'photo or video'} above.</p>}
      <ul className="adm-media">
        {shown.map((f) => {
          const inUse = used.includes(f.url)
          return (
            <li key={f.name}>
              {onPick ? (
                <button type="button" className="adm-tile" onClick={() => onPick(f.url)} title="Use this file">
                  <Thumb url={f.url} />
                </button>
              ) : (
                <a className="adm-tile" href={f.url} target="_blank" rel="noreferrer" title="Open in a new tab">
                  <Thumb url={f.url} />
                </a>
              )}
              <p className="adm-file" title={f.name}>
                {f.name}
              </p>
              <p className="adm-meta">
                {size(f.size)}
                {inUse && <b>In use</b>}
              </p>
              {!onPick && (
                <div className="adm-row">
                  <button type="button" className="adm-btn" onClick={() => copy(f.url)}>
                    {copied === f.url ? 'Copied' : 'Copy link'}
                  </button>
                  <Danger sure={inUse ? 'In use. Delete anyway?' : 'Really delete?'} onConfirm={() => remove(f)} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ---------- single fields ---------- */
function MediaField({ def, value, onChange }) {
  const { pickMedia } = useContext(AdminContext)
  const url = mediaUrl(value)
  const what = def.kind === 'video' ? 'video' : def.kind === 'image' ? 'photo' : 'photo or video'
  return (
    <div className="adm-mediafield">
      <Thumb url={url} />
      <div>
        <p className="adm-file">{value ? value.split('/').pop() : `No ${what} chosen`}</p>
        <div className="adm-row">
          <button type="button" className="adm-btn" onClick={async () => {
            const picked = await pickMedia(def.kind || 'any')
            if (picked) onChange(picked)
          }}>
            {value ? `Change ${what}` : `Choose ${what}`}
          </button>
          {value && (
            <button type="button" className="adm-btn" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Strings({ def, value, onChange }) {
  const list = Array.isArray(value) ? value : []
  const set = (i, v) => onChange(list.map((x, k) => (k === i ? v : x)))
  return (
    <div className="adm-strings">
      {list.map((s, i) => (
        <div key={i} className="adm-string">
          <input value={s} aria-label={`${def.noun || 'item'} ${i + 1}`} onChange={(e) => set(i, e.target.value)} />
          <button type="button" className="adm-icon" aria-label="Move up" disabled={!i} onClick={() => onChange(move(list, i, i - 1))}>
            ↑
          </button>
          <button type="button" className="adm-icon" aria-label="Move down" disabled={i === list.length - 1} onClick={() => onChange(move(list, i, i + 1))}>
            ↓
          </button>
          <button type="button" className="adm-icon" aria-label="Remove" onClick={() => onChange(list.filter((_, k) => k !== i))}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="adm-btn" onClick={() => onChange([...list, ''])}>
        Add {def.noun || 'item'}
      </button>
    </div>
  )
}

// The form of one open item, in a side sheet so the list stays in view.
function Sheet({ title, kind, onClose, children, footer }) {
  const box = useRef(null)
  useEscape(onClose)
  useEffect(() => {
    const back = document.activeElement
    box.current.focus()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      back?.focus?.()
    }
  }, [])
  return (
    <div className="adm-sheet-back" onClick={onClose}>
      <aside className="adm-sheet" role="dialog" aria-modal="true" aria-label={title} ref={box} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <header className="adm-sheet-head">
          <div>
            <span>{kind}</span>
            <h3>{title}</h3>
          </div>
          <button type="button" className="adm-btn primary" onClick={onClose}>
            Done
          </button>
        </header>
        <div className="adm-sheet-body">{children}</div>
        <footer className="adm-sheet-foot">{footer}</footer>
      </aside>
    </div>
  )
}

// A list of things, each with its own small form. One is open at a time.
export function Items({ def, value, onChange }) {
  const list = Array.isArray(value) ? value : []
  const [open, setOpen] = useState(-1)
  const shift = (i, to) => {
    onChange(move(list, i, to))
    setOpen((o) => (o === i ? to : o === to ? i : o))
  }
  const close = useCallback(() => setOpen(-1), [])
  return (
    <div className={`adm-items ${def.sheet ? 'outline' : ''}`}>
      {list.map((item, i) => {
        const name = (def.name?.(item) || '').trim() || `${def.noun} ${i + 1}`
        const isOpen = open === i
        const form = (
          <>
            {def.about?.(item) && <p className="adm-help">{def.about(item)}</p>}
            <Fields schema={typeof def.of === 'function' ? def.of(item) : def.of} value={item} onChange={(v) => onChange(list.map((x, k) => (k === i ? v : x)))} />
          </>
        )
        const remove = (
          <Danger
            label={`Delete this ${def.noun}`}
            onConfirm={() => {
              onChange(list.filter((_, k) => k !== i))
              setOpen(-1)
            }}
          />
        )
        return (
          <div key={i} className={`adm-item ${isOpen ? 'open' : ''}`}>
            <div className="adm-item-head">
              <button type="button" className="adm-item-name" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                {def.sheet ? <b aria-hidden="true">{i + 1}</b> : <i aria-hidden="true">{isOpen ? '–' : '+'}</i>}
                <span>{name}</span>
                {def.badge?.(item) && <em>{def.badge(item)}</em>}
                {def.sheet && <u>Edit</u>}
              </button>
              <button type="button" className="adm-icon" aria-label={`Move ${name} up`} disabled={!i} onClick={() => shift(i, i - 1)}>
                ↑
              </button>
              <button type="button" className="adm-icon" aria-label={`Move ${name} down`} disabled={i === list.length - 1} onClick={() => shift(i, i + 1)}>
                ↓
              </button>
            </div>
            {isOpen &&
              (def.sheet ? (
                <Sheet title={name} kind={`Section ${i + 1} of ${list.length}: ${BLOCKS[item.type]?.label || item.type}`} onClose={close} footer={remove}>
                  {form}
                </Sheet>
              ) : (
                <div className="adm-item-body">
                  {form}
                  {remove}
                </div>
              ))}
          </div>
        )
      })}
      {!list.length && <p className="adm-empty">No {def.noun}s yet.</p>}
      {def.adder?.((item) => {
        onChange([...list, item])
        setOpen(list.length)
      })}
      {def.blank && (
        <button
          type="button"
          className="adm-btn primary"
          onClick={() => {
            onChange([...list, structuredClone(def.blank)])
            setOpen(list.length)
          }}
        >
          Add {/^[aeiou]/i.test(def.noun) ? 'an' : 'a'} {def.noun}
        </button>
      )}
    </div>
  )
}

function Field({ def, value, onChange }) {
  const { doc } = useContext(AdminContext)
  const id = useId()
  const services = (doc.services || []).map((s) => s.name).filter(Boolean)
  const text = value ?? ''
  let control

  if (def.type === 'bool') {
    return (
      <div className="adm-field">
        <label className="adm-check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{def.label}</span>
        </label>
        {def.help && <p className="adm-help">{def.help}</p>}
      </div>
    )
  }
  if (def.type === 'group') {
    return (
      <fieldset className="adm-group">
        <legend>{def.label}</legend>
        <Fields schema={def.of} value={value || {}} onChange={onChange} />
      </fieldset>
    )
  }

  if (def.type === 'area') control = <textarea id={id} rows={def.rows || 3} value={text} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />
  else if (def.type === 'number') control = <input id={id} type="number" min="0" value={text} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
  else if (def.type === 'date') control = <input id={id} type="date" value={text} onChange={(e) => onChange(e.target.value)} />
  else if (def.type === 'select')
    control = (
      <select id={id} value={text} onChange={(e) => onChange(e.target.value)}>
        {!def.options.some(([v]) => v === text) && <option value={text}>{text || 'Choose'}</option>}
        {def.options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    )
  else if (def.type === 'service')
    control = (
      <select id={id} value={text} onChange={(e) => onChange(e.target.value)}>
        {!services.includes(text) && <option value={text}>{text || 'Choose a service'}</option>}
        {services.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    )
  else if (def.type === 'services') {
    const picked = Array.isArray(value) ? value : []
    control = (
      <div className="adm-picks">
        {services.map((s) => (
          <label key={s} className="adm-check">
            <input type="checkbox" checked={picked.includes(s)} onChange={(e) => onChange(e.target.checked ? [...picked, s] : picked.filter((x) => x !== s))} />
            <span>{s}</span>
          </label>
        ))}
      </div>
    )
  } else if (def.type === 'picks') {
    const picked = Array.isArray(value) ? value : []
    control = (
      <div className="adm-picks">
        {def.options.map(([v, label]) => (
          <label key={v} className="adm-check">
            <input
              type="checkbox"
              checked={picked.includes(v)}
              disabled={!picked.includes(v) && picked.length >= (def.max || 99)}
              onChange={(e) => onChange(e.target.checked ? [...picked, v] : picked.filter((x) => x !== v))}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    )
  } else if (def.type === 'link') control = <input id={id} value={text} list="adm-links" placeholder="/contact or https://" onChange={(e) => onChange(e.target.value)} />
  else if (def.type === 'slug')
    control = (
      <div className="adm-prefixed">
        <span>{def.prefix}</span>
        <input id={id} value={text} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onChange(slug(e.target.value))} />
      </div>
    )
  else if (def.type === 'media') control = <MediaField def={def} value={text} onChange={onChange} />
  else if (def.type === 'strings') control = <Strings def={def} value={value} onChange={onChange} />
  else if (def.type === 'items') control = <Items def={def} value={value} onChange={onChange} />
  else if (def.type === 'sections') control = <Items def={SECTIONS} value={value} onChange={onChange} />
  else control = <input id={id} value={text} placeholder={def.placeholder} onChange={(e) => onChange(e.target.value)} />

  const count = def.max && typeof text === 'string' ? text.length : null
  return (
    <div className="adm-field">
      <label htmlFor={id}>
        {def.label}
        {count !== null && <span className={`adm-count ${count > def.max ? 'over' : ''}`}>{count} of {def.max}</span>}
      </label>
      {control}
      {def.help && <p className="adm-help">{def.help}</p>}
    </div>
  )
}

const OPTIONAL = / \(optional\)/i
const filled = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : false)

// "Button text" and "Button goes to" are one thing to a person, so they sit side by side.
function ButtonPair({ text, to, value, onChange }) {
  return (
    <fieldset className="adm-group adm-pair">
      <legend>{text.label.replace(OPTIONAL, '').replace(/ text$/i, '')}</legend>
      <Field def={{ ...text, label: 'Words on the button' }} value={value?.[text.k]} onChange={(v) => onChange({ ...value, [text.k]: v })} />
      <Field def={{ ...to, label: 'Opens' }} value={value?.[to.k]} onChange={(v) => onChange({ ...value, [to.k]: v })} />
    </fieldset>
  )
}

// Draws a form. Optional and styling fields (marked "(optional)" or more: true) fold under
// "More options", which starts open when one of them already holds something.
export function Fields({ schema, value, onChange }) {
  const rows = []
  for (let i = 0; i < schema.length; i++) {
    const def = schema[i]
    const next = schema[i + 1]
    const pair = def.k.endsWith('Label') && next?.k === def.k.slice(0, -5) + 'To'
    rows.push({ def, to: pair ? next : null, more: !!def.more || OPTIONAL.test(def.label) })
    if (pair) i++
  }
  const main = rows.filter((r) => !r.more)
  const extra = main.length && rows.length > 3 ? rows.filter((r) => r.more) : []
  // A colour always holds a value, so only typed or chosen content counts.
  const [startOpen] = useState(() => extra.some((r) => r.def.type !== 'select' && filled(value?.[r.def.k])))
  const draw = (r, plain) =>
    r.to ? (
      <ButtonPair key={r.def.k} text={r.def} to={r.to} value={value} onChange={onChange} />
    ) : (
      <Field key={r.def.k} def={plain ? { ...r.def, label: r.def.label.replace(OPTIONAL, '') } : r.def} value={value?.[r.def.k]} onChange={(v) => onChange({ ...value, [r.def.k]: v })} />
    )
  if (!extra.length) return rows.map((r) => draw(r, false))
  return (
    <>
      {main.map((r) => draw(r, false))}
      <details className="adm-more" open={startOpen}>
        <summary>
          More options <span>{extra.map((r) => r.def.label.replace(OPTIONAL, '').replace(/ text$/i, '').toLowerCase()).join(', ')}</span>
        </summary>
        <div className="adm-more-body">{extra.map((r) => draw(r, true))}</div>
      </details>
    </>
  )
}
