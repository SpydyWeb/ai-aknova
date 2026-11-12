import { parse, pieces } from '../rich.js'

const outside = (href) => /^https?:/i.test(href)

function Line({ text }) {
  return pieces(text).map(([kind, t, href], i) =>
    kind === 'b' ? <strong key={i}>{t}</strong> : kind === 'i' ? <em key={i}>{t}</em> : kind === 'a' ? <a key={i} href={href} {...(outside(href) ? { target: '_blank', rel: 'noreferrer' } : {})}>{t}</a> : t,
  )
}

// Text from the admin panel's text editor: paragraphs, lists, subheadings, bold, italic and links.
export default function Rich({ text }) {
  return parse(text).map((b, i) => {
    if (b.type === 'h') return <h3 key={i} className="rich-h"><Line text={b.lines[0]} /></h3>
    if (b.type === 'ul' || b.type === 'ol') {
      const List = b.type
      return <List key={i} className="rich-list">{b.lines.map((l, k) => <li key={k}><Line text={l} /></li>)}</List>
    }
    return <p key={i}>{b.lines.map((l, k) => <span key={k}>{k > 0 && <br />}<Line text={l} /></span>)}</p>
  })
}

