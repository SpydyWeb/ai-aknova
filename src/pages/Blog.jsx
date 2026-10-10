import PageHero from '../components/PageHero.jsx'
import { PostCard } from '../components/BlogCards.jsx'
import { POSTS } from '../data.js'

export default function Blog() {
  return (
    <>
      <PageHero
        tone="sky"
        title="Plain advice on websites, marketing and software"
        text="Short articles for business owners. No jargon, and nothing you need a developer to understand."
        models={['SEO', 'Digital marketing', 'AI automation', 'CRM systems', 'Web development']}
      />
      <section className="blog blog-all">
        <ul className="post-grid">
          {POSTS.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </ul>
      </section>
    </>
  )
}
