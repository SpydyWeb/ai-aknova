import { useReducedMotion } from 'framer-motion'
import Hero from '../components/Hero.jsx'
import Marquee from '../components/Marquee.jsx'
import Services from '../components/Services.jsx'
import Work from '../components/Work.jsx'
import BuildStory from '../components/BuildStory.jsx'
import Process from '../components/Process.jsx'
import Why from '../components/Why.jsx'
import Voices from '../components/Voices.jsx'
import Till from '../components/Till.jsx'
import Faq from '../components/Faq.jsx'

export default function Home() {
  const reduce = useReducedMotion()
  return (
    <>
      <Hero />
      <Marquee />
      <Services />
      <Work />
      {reduce ? <Process /> : <BuildStory />}
      <Why />
      <Voices />
      <Till />
      <Faq />
    </>
  )
}
