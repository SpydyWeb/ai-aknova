import { useParams } from 'react-router-dom'
import Blocks from '../components/Blocks.jsx'
import NotFound from './NotFound.jsx'
import { SERVICE_INFO } from '../data.js'
import { serviceBlocks } from '../blocks.js'
import { MLink, press, slug } from '../ui.jsx'

// A service page is a stack of sections, edited under Services in the admin panel.
// A service saved before sections existed gets the standard set, built from its details.
const sectionsOf = (s) => (s.blocks.length ? s.blocks : serviceBlocks(s))

export default function ServiceDetail() {
  const { id } = useParams()
  const i = SERVICE_INFO.findIndex((s) => slug(s.name) === id)
  if (i < 0) return <NotFound />

  const s = SERVICE_INFO[i]
  const prev = SERVICE_INFO[(i + SERVICE_INFO.length - 1) % SERVICE_INFO.length]
  const next = SERVICE_INFO[(i + 1) % SERVICE_INFO.length]

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
