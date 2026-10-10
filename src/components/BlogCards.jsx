import { Link } from 'react-router-dom'
import { POSTS, mediaUrl } from '../data.js'
import { MLink, press } from '../ui.jsx'
import Tilt from './Tilt.jsx'

export function PostCard({ post }) {
  return (
    <Tilt as="li" max={10} className="post-card">
      <Link to={`/blog/${post.id}`} data-cursor="Read">
        <span className={`post-cover bg-${post.tone}`}>
          {post.cover && <img src={mediaUrl(post.cover)} alt="" loading="lazy" />}
          {post.topic && <span>{post.topic}</span>}
        </span>
        <h3>{post.title}</h3>
        <p>{post.intro}</p>
        {post.minutes ? <small>{post.minutes} minute read</small> : null}
      </Link>
    </Tilt>
  )
}

// The latest articles, shown on the home page.
export default function BlogCards({ title = 'From the blog' }) {
  if (!POSTS.length) return null
  return (
    <section id="blog" className="blog">
      <div className="blog-head">
        <h2>{title}</h2>
        <MLink className="btn btn-paper" to="/blog" {...press}>
          Read all articles
        </MLink>
      </div>
      <ul className="post-grid">
        {POSTS.slice(0, 3).map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </ul>
    </section>
  )
}
