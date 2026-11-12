// Formatted text written in the admin panel's text editor. It is stored as plain text with a few
// marks, so old content still reads the same:
//   **bold**   *italic*   [link text](https://...)   "## " a subheading
//   "- " a bullet list   "1. " a numbered list   an empty line starts a new paragraph
// The site draws it with components/Rich.jsx as React elements, never as raw HTML, so nothing
// typed can run as code. This file has no JSX because the server and build scripts use it too.

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g
const safeHref = (u) => (/^(https?:\/\/|mailto:|tel:|\/)/i.test(u) ? u : null)
const BULLET = /^\s*[-*]\s+/
const NUMBER = /^\s*\d+[.)]\s+/
const HEADING = /^##\s+/

// Splits text into paragraphs, lists and subheadings.
export function parse(text) {
  const out = []
  for (const chunk of String(text || '').split(/\n\s*\n/)) {
    let para = []
    const flush = () => para.length && (out.push({ type: 'p', lines: para }), (para = []))
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue
      const kind = HEADING.test(line) ? 'h' : BULLET.test(line) ? 'ul' : NUMBER.test(line) ? 'ol' : 'p'
      if (kind === 'p') {
        para.push(line.trim())
        continue
      }
      flush()
      const item = line.replace(kind === 'h' ? HEADING : kind === 'ul' ? BULLET : NUMBER, '').trim()
      const last = out.at(-1)
      if (kind === 'h') out.push({ type: 'h', lines: [item] })
      else if (last?.type === kind && last.open) last.lines.push(item)
      else out.push({ type: kind, lines: [item], open: true })
    }
    flush()
    out.forEach((b) => delete b.open)
  }
  return out
}

// Bold, italic and links inside one line, as a list of [kind, text, href] pieces.
export function pieces(line) {
  const out = []
  let at = 0
  for (const m of line.matchAll(INLINE)) {
    if (m.index > at) out.push(['text', line.slice(at, m.index)])
    if (m[1] !== undefined) out.push(['b', m[1]])
    else if (m[2] !== undefined) out.push(['i', m[2]])
    else out.push(safeHref(m[4]) ? ['a', m[3], m[4]] : ['text', m[3]])
    at = m.index + m[0].length
  }
  if (at < line.length) out.push(['text', line.slice(at)])
  return out
}

// The same, as HTML for the plain pages search engines read.
export function richHtml(text, esc) {
  const line = (l) =>
    pieces(l)
      .map(([kind, t, href]) => (kind === 'b' ? `<strong>${esc(t)}</strong>` : kind === 'i' ? `<em>${esc(t)}</em>` : kind === 'a' ? `<a href="${esc(href)}">${esc(t)}</a>` : esc(t)))
      .join('')
  return parse(text)
    .map((b) => (b.type === 'h' ? `<h3>${line(b.lines[0])}</h3>` : b.type === 'p' ? `<p>${b.lines.map(line).join('<br />')}</p>` : `<${b.type}>${b.lines.map((l) => `<li>${line(l)}</li>`).join('')}</${b.type}>`))
    .join('')
}

// Without the marks, for descriptions and structured data.
export const plainText = (text) =>
  parse(text)
    .map((b) => b.lines.map((l) => pieces(l).map((p) => p[1]).join('')).join(' '))
    .join(' ')
