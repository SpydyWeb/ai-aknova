import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { PostCard } from '../components/BlogCards.jsx'
import { POSTS, mediaUrl } from '../data.js'
import { paragraphs } from '../blocks.js'
import { MLink, press } from '../ui.jsx'

export default function BlogPost() {
  const { id } = useParams()
  const post = POSTS.find((p) => p.id === id)
  if (!post) return <NotFound />
  const others = POSTS.filter((p) => p.id !== id).slice(0, 2)

  return (
    <>
      <article className="post">
        <Link className="more" to="/blog">
          All articles
        </Link>
        <div className={`post-banner bg-${post.tone}`}>
          <span>{post.topic}</span>
          {post.minutes ? <span>{post.minutes} minute read</span> : null}
        </div>
        <h1>{post.title}</h1>
        <p className="lede">{post.intro}</p>
        {post.cover && <img className="post-photo" src={mediaUrl(post.cover)} alt="" />}
        {post.body.map((s, i) => (
          <section key={i}>
            {s.heading && <h2>{s.heading}</h2>}
            {paragraphs(s.text).map((t, k) => (
              <p key={k}>{t}</p>
            ))}
            {s.image && <img className="post-photo" src={mediaUrl(s.image)} alt="" loading="lazy" />}
          </section>
        ))}
        <div className="post-end">
          <p>Want help with this in your own business?</p>
          <MLink className="btn btn-blue" to="/contact" {...press}>
            Start a project
          </MLink>
        </div>
      </article>
      <section className="blog blog-more">
        <h2>Keep reading</h2>
        <ul className="post-grid">
          {others.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </ul>
      </section>
    </>
  )
}
