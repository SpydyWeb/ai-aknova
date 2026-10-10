// Form fields for the admin panel. A screen describes what it edits as a list of field
// definitions (see schema.js and ../blocks.js) and <Fields> draws the form.
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { isVideo } from '../blocks.js'
import { mediaUrl, slug } from '../data.js'
import { api } from './api.js'

// Gives fields the whole site content (for lists of services and pages) and a way to open the media library.
export const AdminContext = createContext({ doc: {}, pickMedia: async () => null })

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
  const { doc } = useContext(AdminContext)
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
          <strong>Drop files here</strong>, or choose them from your computer. Photos (JPG, PNG, WebP, GIF, SVG), videos (MP4, WebM, MOV) and PDFs, up to 300 MB each.
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

// A list of things, each with its own small form. One is open at a time.
export function Items({ def, value, onChange, renderExtra }) {
  const list = Array.isArray(value) ? value : []
  const [open, setOpen] = useState(-1)
  const shift = (i, to) => {
    onChange(move(list, i, to))
    setOpen((o) => (o === i ? to : o === to ? i : o))
  }
  return (
    <div className="adm-items">
      {list.map((item, i) => {
        const name = (def.name?.(item) || '').trim() || `${def.noun} ${i + 1}`
        const isOpen = open === i
        return (
          <div key={i} className={`adm-item ${isOpen ? 'open' : ''}`}>
            <div className="adm-item-head">
              <button type="button" className="adm-item-name" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                <i aria-hidden="true">{isOpen ? '–' : '+'}</i>
                <span>{name}</span>
                {def.badge?.(item) && <em>{def.badge(item)}</em>}
              </button>
              <button type="button" className="adm-icon" aria-label={`Move ${name} up`} disabled={!i} onClick={() => shift(i, i - 1)}>
                ↑
              </button>
              <button type="button" className="adm-icon" aria-label={`Move ${name} down`} disabled={i === list.length - 1} onClick={() => shift(i, i + 1)}>
                ↓
              </button>
            </div>
            {isOpen && (
              <div className="adm-item-body">
                {def.about?.(item) && <p className="adm-help">{def.about(item)}</p>}
                <Fields schema={typeof def.of === 'function' ? def.of(item) : def.of} value={item} onChange={(v) => onChange(list.map((x, k) => (k === i ? v : x)))} />
                {renderExtra?.(item, i)}
                <Danger
                  label={`Delete this ${def.noun}`}
                  onConfirm={() => {
                    onChange(list.filter((_, k) => k !== i))
                    setOpen(-1)
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
      {!list.length && <p className="adm-empty">No {def.noun}s yet.</p>}
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

export function Fields({ schema, value, onChange }) {
  return schema.map((def) => <Field key={def.k} def={def} value={value?.[def.k]} onChange={(v) => onChange({ ...value, [def.k]: v })} />)
}
