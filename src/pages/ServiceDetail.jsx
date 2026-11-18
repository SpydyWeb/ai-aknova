import { useParams } from 'react-router-dom'
import Blocks from '../components/Blocks.jsx'
import NotFound from './NotFound.jsx'
import { ALL_SERVICES, SERVICE_INFO } from '../data.js'
import { serviceBlocks } from '../blocks.js'
import { MLink, press, slug } from '../ui.jsx'

// A service page is a stack of sections, edited under Services in the admin panel.
// A service saved before sections existed gets the standard set, built from its details.
const sectionsOf = (s) => (s.blocks.length ? s.blocks : serviceBlocks(s))

export default function ServiceDetail() {
  const { id } = useParams()
  const s = ALL_SERVICES.find((x) => slug(x.name) === id)
  if (!s) return <NotFound />

  // A hidden service links on to the shown ones, but is never linked to itself.
  const shown = SERVICE_INFO.length ? SERVICE_INFO : [s]
  const i = shown.indexOf(s)
  const prev = shown[i < 0 ? shown.length - 1 : (i + shown.length - 1) % shown.length]
  const next = shown[i < 0 ? 0 : (i + 1) % shown.length]

  return (
    <>
      <Blocks blocks={sectionsOf(s)} owner={s} />
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
