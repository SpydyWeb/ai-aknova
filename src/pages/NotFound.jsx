import PageHero from '../components/PageHero.jsx'
import { MLink, press } from '../ui.jsx'

export default function NotFound() {
  return (
    <PageHero
      tone="sun"
      title="This page is not here"
      text="The link may be old or mistyped. The home page has everything."
      models={['SEO', 'UI/UX design', 'AI automation']}
    >
      <div className="row">
        <MLink className="btn btn-ink" to="/" {...press}>
          Go to the home page
        </MLink>
      </div>
    </PageHero>
  )
}
