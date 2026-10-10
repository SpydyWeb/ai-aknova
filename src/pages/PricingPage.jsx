import PageHero from '../components/PageHero.jsx'
import Pricing from '../components/Pricing.jsx'
import Faq from '../components/Faq.jsx'

export default function PricingPage() {
  return (
    <>
      <PageHero
        tone="sun"
        title="Clear prices before we start"
        text="Three starting points. Tell us what you need and we shape the plan and the price around it."
        models={['POS systems', 'Web development', 'CRM systems', 'Digital marketing', 'AI automation']}
      />
      <Pricing />
      <Faq />
    </>
  )
}
