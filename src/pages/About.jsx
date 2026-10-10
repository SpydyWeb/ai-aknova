import PageHero from '../components/PageHero.jsx'
import Why from '../components/Why.jsx'
import Process from '../components/Process.jsx'
import Voices from '../components/Voices.jsx'

export default function About() {
  return (
    <>
      <PageHero
        tone="sky"
        title="One team for the whole job"
        text="Aknova Tech is a service company. We design, build and market digital products, and set up the software that runs a business day to day."
        models={['Aknova Tech', 'AI automation', 'CRM systems', 'Social media marketing', 'UI/UX design', 'POS systems']}
      />
      {/* Draft copy: replace with your own story, founding year, team and location. */}
      <section className="story">
        <h2>Why we work this way</h2>
        <p>
          Most businesses end up with one company for the website, another for the app, a freelancer for ads and a
          separate vendor for billing software. Things get lost between them.
        </p>
        <p>
          We put those jobs under one roof. The people who design your screens sit next to the people who build them
          and the people who bring customers to them.
        </p>
      </section>
      <Why />
      <Process />
      <Voices />
    </>
  )
}
