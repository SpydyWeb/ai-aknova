import { useReducedMotion } from 'framer-motion'
import { POSTS } from '../data.js'
import Hero from './Hero.jsx'
import Marquee from './Marquee.jsx'
import Services from './Services.jsx'
import ServiceGrid from './ServiceGrid.jsx'
import Work from './Work.jsx'
import WorkGrid from './WorkGrid.jsx'
import BuildStory from './BuildStory.jsx'
import Process from './Process.jsx'
import Why from './Why.jsx'
import Pricing from './Pricing.jsx'
import Voices from './Voices.jsx'
import Till from './Till.jsx'
import BlogCards, { PostCard } from './BlogCards.jsx'
import Faq from './Faq.jsx'
import ContactForm from './ContactForm.jsx'
import PageHero from './PageHero.jsx'
import { CardsBlock, CtaBlock, GalleryBlock, ImageBlock, SplitBlock, TextBlock, VideoBlock } from './ContentBlocks.jsx'

function Story(props) {
  const reduce = useReducedMotion()
  return reduce ? <Process {...props} /> : <BuildStory {...props} />
}

const BlogGrid = () => (
  <section className="blog blog-all">
    <ul className="post-grid">
      {POSTS.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </ul>
  </section>
)

// Every kind of section named in blocks.js, and the component that draws it.
const DRAW = {
  hero: Hero,
  pageHero: PageHero,
  text: TextBlock,
  split: SplitBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  cards: CardsBlock,
  cta: CtaBlock,
  marquee: Marquee,
  services: Services,
  serviceGrid: ServiceGrid,
  work: Work,
  workGrid: WorkGrid,
  story: Story,
  process: Process,
  why: Why,
  pricing: Pricing,
  voices: Voices,
  till: Till,
  blog: BlogCards,
  blogGrid: BlogGrid,
  faq: Faq,
  contact: ContactForm,
}

// A page is a list of sections, drawn in the order set in the admin panel.
export default function Blocks({ blocks }) {
  return blocks.map(({ type, id, ...props }, i) => {
    const Draw = DRAW[type]
    return Draw ? <Draw key={id || i} {...props} /> : null
  })
}
