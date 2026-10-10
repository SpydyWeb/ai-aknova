// The admin panel, at /admin. It edits content/site.json through the server and never touches a database.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BLOCKS } from '../blocks.js'
import { setContent, slug } from '../data.js'
import { llmsTxt, robotsTxt, seoFor } from '../seo.js'
import logo from '../assets/logo-light.png'
import { api } from './api.js'
import { AdminContext, Danger, Fields, Items, MediaLibrary } from './fields.jsx'
import { AI_FIELDS, LISTS, SEO_FIELDS, SITE_FIELDS } from './schema.js'
import './admin.css'

const MENU = [
  ['Website', [['pages', 'Pages']]],
  ['Content', [['services', 'Services'], ['projects', 'Projects'], ['plans', 'Pricing plans'], ['posts', 'Blog articles'], ['voices', 'Client reviews'], ['faqs', 'FAQs'], ['reasons', 'Why-us cards'], ['steps', 'Process steps']]],
  ['Library', [['media', 'Photos and videos']]],
  ['Settings', [['site', 'Site details'], ['seo', 'SEO'], ['ai', 'AI SEO'], ['account', 'Account and backups']]],
]
const VIEWS = MENU.flatMap(([, items]) => items.map(([id]) => id))
const RESERVED = ['/admin', '/api', '/uploads', '/assets', '/services/', '/blog/', '/videos']
const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const cleanPath = (s) => '/' + String(s).split('/').map(slug).filter(Boolean).join('/')
const when = (t) => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ---------- signing in ---------- */
function Gate({ me, onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = !me.hasPassword

  const submit = async (e) => {
    e.preventDefault()
    if (creating && password !== again) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await (creating ? api.setup(email, password) : api.login(email, password))
      onDone()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="adm adm-gate">
      <form className="adm-card" onSubmit={submit}>
        <img src={logo} alt="Aknova Tech" width="682" height="76" />
        <h1>{creating ? 'Create your admin account' : 'Sign in to the admin panel'}</h1>
        {me.stuck ? (
          <div className="adm-help">
            <p>This host has no disk, so the admin panel saves into your GitHub repository instead. Add these in the host&rsquo;s settings under Environment Variables, then redeploy:</p>
            <ul className="adm-steps">
              <li><code>GITHUB_REPO</code> the repository, written as owner/name</li>
              <li><code>GITHUB_TOKEN</code> a GitHub fine-grained token with &ldquo;Contents: read and write&rdquo; on that repository</li>
              <li><code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> what you will sign in with</li>
            </ul>
          </div>
        ) : creating && !me.canSetup ? (
          <p className="adm-help">
            No admin account exists yet. For safety it can only be created on the computer the site runs on. Either create it there and upload the <code>content</code> folder, or set <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in the server&rsquo;s settings and reload this page.
          </p>
        ) : (
          <>
            {creating && <p className="adm-help">This email and password protect everything on your website. Use at least 8 characters for the password and keep it somewhere safe.</p>}
            {me.needsEmail && <p className="adm-help">Signing in now needs an email as well. Enter the email you want to use with your existing password; it becomes your admin email.</p>}
            <div className="adm-field">
              <label htmlFor="adm-email">Email</label>
              <input id="adm-email" type="email" autoFocus required autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-pass">Password</label>
              <input id="adm-pass" type="password" required minLength={creating ? 8 : 1} autoComplete={creating ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {creating && (
              <div className="adm-field">
                <label htmlFor="adm-pass2">Type it again</label>
                <input id="adm-pass2" type="password" required autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
              </div>
            )}
            {error && (
              <p className="adm-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="adm-btn primary big" disabled={busy}>
              {creating ? 'Create account' : 'Sign in'}
            </button>
          </>
        )}
        <a className="adm-back" href="/">
          Back to the website
        </a>
      </form>
    </main>
  )
}

/* ---------- title and description for one address, with a search-result preview ---------- */
function SeoBox({ path, value, onChange, noindex = true }) {
  const m = seoFor(path)
  const v = value || {}
  const fields = [
    { k: 'title', label: 'Title in search results', type: 'text', max: 60, placeholder: m.auto?.title },
    { k: 'description', label: 'Description in search results', type: 'area', rows: 3, max: 160, placeholder: m.auto?.description },
    { k: 'image', label: 'Picture when this page is shared', type: 'media', kind: 'image' },
    ...(noindex ? [{ k: 'noindex', label: 'Hide this page from search engines', type: 'bool' }] : []),
  ]
  return (
    <div className="adm-seo">
      <div className="adm-snippet" aria-label="How this page can look on Google">
        <span>{m.url}</span>
        <strong>{m.title}</strong>
        <p>{m.description}</p>
        {m.noindex && <em>Hidden from search engines</em>}
      </div>
      <p className="adm-help">Leave a box empty and the site writes it for you from the page&rsquo;s content, as shown above.</p>
      <Fields schema={fields} value={v} onChange={onChange} />
    </div>
  )
}

/* ---------- pages ---------- */
function AddSection({ onAdd }) {
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <button type="button" className="adm-btn primary" onClick={() => setOpen(true)}>
        Add a section
      </button>
    )
  return (
    <div className="adm-add">
      <div className="adm-add-head">
        <h3>Choose a section to add</h3>
        <button type="button" className="adm-btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {['Write your own', 'Ready-made'].map((group) => (
        <div key={group}>
          <h4>{group === 'Ready-made' ? 'Ready-made interactive sections' : 'Sections you write yourself'}</h4>
          <ul>
            {Object.entries(BLOCKS)
              .filter(([, b]) => b.group === group)
              .map(([type, b]) => (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd({ id: newId(), type, ...structuredClone(b.blank) })
                      setOpen(false)
                    }}
                  >
                    <strong>{b.label}</strong>
                    <span>{b.about}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

const SECTIONS = {
  noun: 'section',
  name: (b) => [BLOCKS[b.type]?.label || b.type, b.title || b.before].filter(Boolean).join(': '),
  about: (b) => BLOCKS[b.type]?.about,
  of: (b) => BLOCKS[b.type]?.fields || [],
}

function PageEditor({ page, onChange, onDelete, onBack, taken }) {
  const set = (k) => (v) => onChange({ ...page, [k]: v })
  const clash = taken.includes(page.path)
  const reserved = RESERVED.some((r) => page.path === r || page.path.startsWith(r.endsWith('/') ? r : r + '/'))
  return (
    <>
      <button type="button" className="adm-btn" onClick={onBack}>
        Back to all pages
      </button>
      <div className="adm-panel">
        <h2>Page details</h2>
        <div className="adm-field">
          <label htmlFor="pg-title">Page name</label>
          <input id="pg-title" value={page.title} onChange={(e) => set('title')(e.target.value)} />
          <p className="adm-help">Shown in the menu and used in the page title.</p>
        </div>
        <div className="adm-field">
          <label htmlFor="pg-path">Address</label>
          <input id="pg-path" value={page.path} disabled={page.core} onChange={(e) => set('path')(e.target.value)} onBlur={(e) => set('path')(cleanPath(e.target.value))} />
          {page.core ? <p className="adm-help">Other parts of the site link to this page, so its address is fixed.</p> : <p className="adm-help">What comes after your website address, for example /careers.</p>}
          {(clash || reserved) && (
            <p className="adm-error" role="alert">
              {clash ? 'Another page already uses this address.' : 'That address is used by the site itself. Choose another.'}
            </p>
          )}
        </div>
        {page.path !== '/' && (
          <label className="adm-check">
            <input type="checkbox" checked={!!page.inNav} onChange={(e) => set('inNav')(e.target.checked)} />
            <span>Show this page in the menu and footer</span>
          </label>
        )}
      </div>

      <div className="adm-panel">
        <h2>Sections</h2>
        <p className="adm-help">The page shows these from top to bottom. Open one to edit it, use the arrows to reorder.</p>
        <Items def={SECTIONS} value={page.blocks} onChange={set('blocks')} />
        <AddSection onAdd={(b) => set('blocks')([...(page.blocks || []), b])} />
      </div>

      <div className="adm-panel">
        <h2>Search engines</h2>
        <SeoBox path={page.path} value={page.seo} onChange={set('seo')} />
      </div>

      {!page.core && (
        <div className="adm-panel">
          <h2>Delete this page</h2>
          <p className="adm-help">The page and its sections are removed when you save. Uploaded photos and videos stay in the library.</p>
          <Danger label="Delete page" sure="Really delete this page?" onConfirm={onDelete} />
        </div>
      )}
    </>
  )
}

function Pages({ doc, setDoc }) {
  const [editing, setEditing] = useState(-1)
  const pages = doc.pages
  const setPages = (next) => setDoc({ ...doc, pages: next })

  const add = () => {
    let path = '/new-page'
    for (let n = 2; pages.some((p) => p.path === path); n++) path = `/new-page-${n}`
    setPages([
      ...pages,
      {
        path,
        title: 'New page',
        inNav: true,
        core: false,
        seo: { title: '', description: '', image: '', noindex: false },
        blocks: [
          { id: newId(), type: 'pageHero', ...structuredClone(BLOCKS.pageHero.blank), title: 'New page' },
          { id: newId(), type: 'text', ...structuredClone(BLOCKS.text.blank) },
        ],
      },
    ])
    setEditing(pages.length)
  }

  if (pages[editing])
    return (
      <PageEditor
        page={pages[editing]}
        taken={pages.filter((_, i) => i !== editing).map((p) => p.path)}
        onBack={() => setEditing(-1)}
        onChange={(p) => setPages(pages.map((x, i) => (i === editing ? p : x)))}
        onDelete={() => {
          setPages(pages.filter((_, i) => i !== editing))
          setEditing(-1)
        }}
      />
    )

  return (
    <div className="adm-panel">
      <p className="adm-help">Every page is a stack of sections. The order here is the order in the menu.</p>
      <ul className="adm-pages">
        {pages.map((p, i) => (
          <li key={i}>
            <button type="button" className="adm-page" onClick={() => setEditing(i)}>
              <strong>{p.title}</strong>
              <span>{p.path}</span>
              <em>
                {p.blocks?.length || 0} sections{p.inNav ? ', in menu' : ''}{p.seo?.noindex ? ', hidden from search' : ''}
              </em>
            </button>
            <button type="button" className="adm-icon" aria-label={`Move ${p.title} up`} disabled={!i} onClick={() => setPages(pages.map((x, k) => (k === i - 1 ? p : k === i ? pages[i - 1] : x)))}>
              ↑
            </button>
            <button type="button" className="adm-icon" aria-label={`Move ${p.title} down`} disabled={i === pages.length - 1} onClick={() => setPages(pages.map((x, k) => (k === i + 1 ? p : k === i ? pages[i + 1] : x)))}>
              ↓
            </button>
            <a className="adm-btn" href={p.path} target="_blank" rel="noreferrer">
              View
            </a>
          </li>
        ))}
      </ul>
      <button type="button" className="adm-btn primary" onClick={add}>
        Add a new page
      </button>
    </div>
  )
}

/* ---------- SEO ---------- */
function SeoView({ doc, setDoc }) {
  const [open, setOpen] = useState('')
  const rows = [
    ...doc.pages.map((p, i) => ({ path: p.path, name: p.title, kind: 'Page', value: p.seo, noindex: true, set: (seo) => setDoc({ ...doc, pages: doc.pages.map((x, k) => (k === i ? { ...x, seo } : x)) }) })),
    ...doc.services.map((s, i) => ({ path: `/services/${slug(s.name)}`, name: s.name, kind: 'Service', value: s.seo, set: (seo) => setDoc({ ...doc, services: doc.services.map((x, k) => (k === i ? { ...x, seo } : x)) }) })),
    ...doc.posts.map((p, i) => ({ path: `/blog/${p.id || slug(p.title)}`, name: p.title, kind: 'Article', value: p.seo, set: (seo) => setDoc({ ...doc, posts: doc.posts.map((x, k) => (k === i ? { ...x, seo } : x)) }) })),
  ]
  return (
    <>
      <div className="adm-panel">
        <h2>Whole site</h2>
        <Fields schema={SEO_FIELDS} value={doc.seo} onChange={(seo) => setDoc({ ...doc, seo })} />
        <p className="adm-help">
          The site makes these for you and keeps them up to date: <a href="/sitemap.xml" target="_blank" rel="noreferrer">sitemap.xml</a>, <a href="/robots.txt" target="_blank" rel="noreferrer">robots.txt</a>, a canonical link on every page, sharing pictures, and structured data for your business, services, articles, FAQs and breadcrumbs. After going live, submit the sitemap in Google Search Console.
        </p>
      </div>
      <div className="adm-panel">
        <h2>Every address on the site</h2>
        <p className="adm-help">Open one to set its title, description and sharing picture. Titles work best under 60 characters and descriptions under 160.</p>
        <ul className="adm-urls">
          {rows.map((r) => {
            const m = seoFor(r.path)
            const custom = !!(r.value?.title?.trim() || r.value?.description?.trim())
            return (
              <li key={r.path} className={open === r.path ? 'open' : ''}>
                <button type="button" aria-expanded={open === r.path} onClick={() => setOpen(open === r.path ? '' : r.path)}>
                  <span>
                    {r.kind}: {r.path}
                  </span>
                  <strong>{m.title}</strong>
                  <em>
                    {custom ? 'Written by you' : 'Written automatically'}
                    {m.title.length > 60 ? `, title is ${m.title.length} characters` : ''}
                    {m.description.length > 160 ? `, description is ${m.description.length} characters` : ''}
                    {m.noindex ? ', hidden from search' : ''}
                  </em>
                </button>
                {open === r.path && <SeoBox path={r.path} value={r.value} onChange={r.set} noindex={!!r.noindex} />}
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

function AiView({ doc, setDoc }) {
  const [tab, setTab] = useState('llms.txt')
  const ai = doc.seo.ai || {}
  const home = seoFor('/')
  const checks = [
    [!!ai.summary?.trim(), 'You wrote your own two-sentence summary', 'Write the summary below in your own words. It is what assistants repeat most.'],
    [(ai.facts || []).filter((f) => f.trim()).length >= 3, 'At least three quotable facts', 'Add facts: years in business, projects delivered, cities served, turnaround times.'],
    [(doc.faqs || []).length >= 5, 'Five or more FAQs', 'Add more questions under FAQs. Assistants lift answers straight from them.'],
    [(doc.posts || []).length >= 3, 'Three or more articles', 'Publish articles that answer the questions your customers ask.'],
    [(doc.site.social || []).some((s) => s.url), 'Social profiles are linked', 'Add your profiles under Site details so assistants can confirm you are a real business.'],
    [!(doc.voices || []).some((v) => /sample/i.test(v.quote || '')), 'Real client reviews', 'Replace the sample reviews with real ones, with names.'],
    [doc.seo.indexing !== false && ai.answers !== false, 'AI assistants are allowed to read the site', 'Switch on "Let AI assistants read the site" below, and site listing under SEO.'],
  ]
  const files = {
    'llms.txt': llmsTxt(),
    'llms-full.txt': llmsTxt(true),
    'robots.txt': robotsTxt(),
    'Structured data': JSON.stringify(home.jsonld, null, 2),
  }
  return (
    <>
      <div className="adm-panel">
        <h2>How ready the site is to be quoted</h2>
        <p className="adm-help">AI assistants such as ChatGPT, Claude, Gemini and Perplexity quote sites that state clear facts in plain words. This list is worked out from your content.</p>
        <ul className="adm-checks">
          {checks.map(([ok, good, todo]) => (
            <li key={good} className={ok ? 'ok' : ''}>
              <b>{ok ? 'Done' : 'To do'}</b>
              {ok ? good : todo}
            </li>
          ))}
        </ul>
      </div>
      <div className="adm-panel">
        <h2>What you tell AI assistants</h2>
        <Fields schema={AI_FIELDS} value={ai} onChange={(next) => setDoc({ ...doc, seo: { ...doc.seo, ai: next } })} />
      </div>
      <div className="adm-panel">
        <h2>What they receive</h2>
        <p className="adm-help">These files are rebuilt from your content every time you save. llms.txt is a short guide written for AI assistants; the full version carries every service, FAQ and article as plain text.</p>
        <div className="adm-tabs" role="tablist">
          {Object.keys(files).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={tab === f} onClick={() => setTab(f)}>
              {f}
            </button>
          ))}
        </div>
        <pre className="adm-pre">{files[tab]}</pre>
      </div>
    </>
  )
}

/* ---------- account ---------- */
function Account({ me, onSignOut, onRestore, dirty }) {
  const [email, setEmail] = useState(me.email || '')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [note, setNote] = useState(null)
  const [backups, setBackups] = useState([])
  const load = () => api.backups().then(setBackups, () => {})
  useEffect(() => {
    load()
  }, [])

  const change = async (e) => {
    e.preventDefault()
    try {
      await api.account(current, email, next)
      setCurrent('')
      setNext('')
      setNote({ ok: true, text: 'Saved. Every other device has been signed out.' })
    } catch (err) {
      setNote({ ok: false, text: err.message })
    }
  }

  return (
    <>
      <form className="adm-panel" onSubmit={change}>
        <h2>Sign-in email and password</h2>
        {me.fixed && <p className="adm-help">This account is set on the server with ADMIN_EMAIL and ADMIN_PASSWORD, so it is changed there.</p>}
        <div className="adm-field">
          <label htmlFor="pw-email">Email you sign in with</label>
          <input id="pw-email" type="email" required autoComplete="username" disabled={me.fixed} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor="pw-new">New password</label>
          <input id="pw-new" type="password" minLength={8} autoComplete="new-password" disabled={me.fixed} value={next} onChange={(e) => setNext(e.target.value)} />
          <p className="adm-help">At least 8 characters. Leave empty to keep your current password.</p>
        </div>
        <div className="adm-field">
          <label htmlFor="pw-now">Current password, to confirm it is you</label>
          <input id="pw-now" type="password" required autoComplete="current-password" disabled={me.fixed} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        {note && (
          <p className={note.ok ? 'adm-ok' : 'adm-error'} role="status">
            {note.text}
          </p>
        )}
        <button type="submit" className="adm-btn primary" disabled={me.fixed}>
          Save sign-in details
        </button>
      </form>

      <div className="adm-panel">
        <h2>Earlier versions</h2>
        <p className="adm-help">{me.remote ? 'Every save is kept in your GitHub repository; these are the last 30 before the current one.' : 'Each time you save, the version before it is kept here (the last 30).'} Restoring one replaces everything on the site with that version; photos and videos are not affected.</p>
        {dirty && <p className="adm-error">Save or discard your current changes before restoring.</p>}
        {!backups.length && <p className="adm-empty">No earlier versions yet. The first one appears after your next save.</p>}
        <ul className="adm-backups">
          {backups.map((b) => (
            <li key={b.name}>
              <span>{me.remote ? 'Saved on' : 'Saved over on'} {when(b.time)}</span>
              {!dirty && (
                <Danger
                  label="Restore"
                  sure="Replace the site with this?"
                  onConfirm={async () => {
                    onRestore(await api.restore(b.name))
                    load()
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="adm-panel">
        <h2>Sign out</h2>
        <button type="button" className="adm-btn" onClick={onSignOut}>
          Sign out of the admin panel
        </button>
      </div>
    </>
  )
}

/* ---------- the panel ---------- */
function Panel({ me, onSignOut }) {
  const [doc, setDocRaw] = useState(null)
  const [saved, setSaved] = useState(null)
  const [state, setState] = useState({ kind: 'idle', text: '' })
  const [picker, setPicker] = useState(null)
  const [view, setViewRaw] = useState(() => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'pages'))
  const [visit, setVisit] = useState(0)
  const dirty = doc !== saved

  useEffect(() => {
    api.content().then(
      (d) => {
        setDocRaw(d)
        setSaved(d)
      },
      (e) => setState({ kind: 'error', text: e.message }),
    )
  }, [])

  const setView = (v) => {
    history.replaceState(null, '', `#${v}`)
    setViewRaw(v)
    setVisit((n) => n + 1)
    window.scrollTo(0, 0)
  }

  // Renaming a service keeps the plans and projects that mention it pointing at the new name.
  const setDoc = useCallback((next) => {
    setDocRaw((prev) => {
      if (prev && next.services !== prev.services && next.services.length === prev.services.length) {
        const renamed = prev.services.map((s, i) => [s.name, next.services[i].name]).filter(([a, b]) => a !== b && a && b)
        if (renamed.length) {
          const to = (name) => renamed.find(([a]) => a === name)?.[1] || name
          return { ...next, plans: next.plans.map((p) => ({ ...p, services: (p.services || []).map(to) })), projects: next.projects.map((p) => ({ ...p, type: to(p.type) })) }
        }
      }
      return next
    })
    setState((s) => (s.kind === 'saved' || s.kind === 'error' ? { kind: 'idle', text: '' } : s))
  }, [])

  const problems = useMemo(() => {
    if (!doc) return []
    const out = []
    const paths = doc.pages.map((p) => p.path)
    if (new Set(paths).size !== paths.length) out.push('Two pages share the same address.')
    if (doc.pages.some((p) => !p.title?.trim())) out.push('A page has no name.')
    if (!paths.includes('/')) out.push('The home page is missing.')
    if (paths.some((p) => RESERVED.some((r) => p === r || p.startsWith(r.endsWith('/') ? r : r + '/')))) out.push('A page uses an address the site needs for itself.')
    const names = doc.services.map((s) => slug(s.name || ''))
    if (new Set(names).size !== names.length) out.push('Two services have the same name.')
    if (names.includes('')) out.push('A service has no name.')
    const ids = doc.posts.map((p) => p.id || slug(p.title || ''))
    if (new Set(ids).size !== ids.length) out.push('Two articles have the same address.')
    return out
  }, [doc])

  const save = useCallback(async () => {
    if (!doc || !dirty || problems.length) return
    setState({ kind: 'saving', text: 'Saving' })
    try {
      await api.save(doc)
      setSaved(doc)
      setState({ kind: 'saved', text: me.remote ? 'Saved. The live website updates in about a minute.' : 'Saved. The website now shows this version.' })
    } catch (e) {
      if (e.status === 401) return onSignOut(true)
      setState({ kind: 'error', text: e.message })
    }
  }, [doc, dirty, problems, onSignOut, me.remote])

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    const leave = (e) => dirty && e.preventDefault()
    addEventListener('keydown', key)
    addEventListener('beforeunload', leave)
    return () => {
      removeEventListener('keydown', key)
      removeEventListener('beforeunload', leave)
    }
  }, [save, dirty])

  const pickMedia = useCallback((kind) => new Promise((resolve) => setPicker({ kind, resolve })), [])
  const closePicker = (url) => {
    picker.resolve(url || null)
    setPicker(null)
  }
  const ctx = useMemo(() => ({ doc: doc || {}, pickMedia, me }), [doc, pickMedia, me])

  if (!doc)
    return (
      <main className="adm adm-gate">
        <p className={state.kind === 'error' ? 'adm-error' : 'adm-help'}>{state.text || 'Loading your content'}</p>
      </main>
    )

  // The SEO previews are worked out from what is on screen now, not from the last save.
  setContent(doc)
  const title = MENU.flatMap(([, items]) => items).find(([id]) => id === view)[1]
  const list = LISTS[view]

  return (
    <AdminContext.Provider value={ctx}>
      <div className="adm adm-shell">
        <aside className="adm-side">
          <a className="adm-brand" href="/" target="_blank" rel="noreferrer" title="Open the website">
            <img src={logo} alt={doc.site.name} width="682" height="76" />
            <span>Admin panel</span>
          </a>
          <nav aria-label="Admin sections">
            {MENU.map(([group, items]) => (
              <div key={group}>
                <h2>{group}</h2>
                {items.map(([id, label]) => (
                  <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="adm-who">
            <span>Signed in as</span>
            <strong title={me.email}>{me.email || 'Admin'}</strong>
            {dirty ? (
              <Danger label="Sign out" sure="Lose unsaved changes?" onConfirm={() => onSignOut(false)} />
            ) : (
              <button type="button" className="adm-btn" onClick={() => onSignOut(false)}>
                Sign out
              </button>
            )}
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-bar">
            <h1>{title}</h1>
            <p className={`adm-state ${problems.length || state.kind === 'error' ? 'bad' : dirty ? 'dirty' : ''}`} role="status">
              {problems[0] || state.text || (dirty ? 'You have changes that are not saved yet.' : 'Everything is saved.')}
            </p>
            {dirty && (
              <button type="button" className="adm-btn" onClick={() => setDocRaw(saved)}>
                Discard changes
              </button>
            )}
            <a className="adm-btn" href="/" target="_blank" rel="noreferrer">
              View website
            </a>
            <button type="button" className="adm-btn primary" disabled={!dirty || !!problems.length || state.kind === 'saving'} onClick={save}>
              {state.kind === 'saving' ? 'Saving' : 'Save changes'}
            </button>
            {dirty ? (
              <Danger label="Sign out" sure="Lose unsaved changes?" onConfirm={() => onSignOut(false)} />
            ) : (
              <button type="button" className="adm-btn" onClick={() => onSignOut(false)}>
                Sign out
              </button>
            )}
          </header>

          <div className="adm-view" key={`${view}${visit}`}>
            {view === 'pages' && <Pages doc={doc} setDoc={setDoc} />}
            {list && (
              <div className="adm-panel">
                <p className="adm-help">{list.intro}</p>
                <Items def={list} value={doc[view]} onChange={(next) => setDoc({ ...doc, [view]: next })} />
              </div>
            )}
            {view === 'media' && (
              <div className="adm-panel">
                <p className="adm-help">Everything you upload is kept here and can be used anywhere on the site. {me.remote ? 'Files are stored in your GitHub repository, in content/uploads.' : 'Files are stored in the site\u2019s own content folder.'}</p>
                <MediaLibrary />
              </div>
            )}
            {view === 'site' && (
              <div className="adm-panel">
                <Fields schema={SITE_FIELDS} value={doc.site} onChange={(site) => setDoc({ ...doc, site })} />
              </div>
            )}
            {view === 'seo' && <SeoView doc={doc} setDoc={setDoc} />}
            {view === 'ai' && <AiView doc={doc} setDoc={setDoc} />}
            {view === 'account' && (
              <Account
                me={me}
                dirty={dirty}
                onSignOut={() => onSignOut(false)}
                onRestore={(d) => {
                  setDocRaw(d)
                  setSaved(d)
                  setState({ kind: 'saved', text: 'Restored. The website now shows that version.' })
                }}
              />
            )}
          </div>
        </div>

        <datalist id="adm-links">
          {doc.pages.map((p) => (
            <option key={p.path} value={p.path}>
              {p.title}
            </option>
          ))}
          {doc.services.map((s) => (
            <option key={s.name} value={`/services/${slug(s.name)}`}>
              {s.name}
            </option>
          ))}
        </datalist>

        {picker && (
          <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Choose a file" onClick={() => closePicker(null)}>
            <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="adm-add-head">
                <h3>Choose a {picker.kind === 'video' ? 'video' : picker.kind === 'image' ? 'photo' : 'photo or video'}</h3>
                <button type="button" className="adm-btn" onClick={() => closePicker(null)}>
                  Cancel
                </button>
              </div>
              <MediaLibrary kind={picker.kind} onPick={closePicker} />
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  )
}

export default function Admin() {
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const check = useCallback(() => api.me().then(setMe, (e) => setError(e.message)), [])

  useEffect(() => {
    document.title = 'Admin panel'
    let robots = document.head.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.append(robots)
    }
    robots.content = 'noindex, nofollow'
    check()
  }, [check])

  if (error)
    return (
      <main className="adm adm-gate">
        <div className="adm-card">
          <h1>The admin panel cannot start</h1>
          <p className="adm-error">{error}</p>
        </div>
      </main>
    )
  if (!me) return null
  if (!me.signedIn) return <Gate me={me} onDone={check} />
  return (
    <Panel
      me={me}
      onSignOut={async (expired) => {
        if (!expired) await api.logout().catch(() => {})
        check()
      }}
    />
  )
}
