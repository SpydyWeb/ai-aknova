import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { PostCard } from '../components/BlogCards.jsx'
import { POSTS } from '../data.js'
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
          <span>{post.minutes} minute read</span>
        </div>
        <h1>{post.title}</h1>
        <p className="lede">{post.intro}</p>
        {post.body.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
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
