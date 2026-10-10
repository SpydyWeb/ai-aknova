import PageHero from '../components/PageHero.jsx'
import { SITE_INFO } from '../data.js'
import { MLink, press } from '../ui.jsx'

export default function NotFound() {
  const t = SITE_INFO.notFound
  return (
    <PageHero
      tone="sun"
      title={t.title || 'This page is not here'}
      text={t.text}
      models={['magnifier', 'cursor', 'robot']}
    >
      <div className="row">
        <MLink className="btn btn-ink" to="/" {...press}>
          {t.button || 'Go to the home page'}
        </MLink>
      </div>
    </PageHero>
  )
}
