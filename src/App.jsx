import { useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Nav from './components/Nav.jsx'
import Closing from './components/Closing.jsx'
import Cursor from './components/Cursor.jsx'
import Seo from './components/Seo.jsx'
import SoundScape from './components/SoundScape.jsx'
import Buddy from './components/Buddy.jsx'
import Home from './pages/Home.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import WorkPage from './pages/WorkPage.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import { Link } from 'react-router-dom'
import PricingPage from './pages/PricingPage.jsx'
import Blog from './pages/Blog.jsx'
import BlogPost from './pages/BlogPost.jsx'
import Logo from './components/Logo.jsx'
import { CONTACT, EMAIL, TAGLINE } from './data.js'
import { OrderProvider } from './ui.jsx'

const CURTAIN = ['sun', 'navy', 'sky', 'blue']

function Shell() {
  const loc = useLocation()
  const reduce = useReducedMotion()
  const visits = useRef(0)

  // Smooth, weighted scrolling on desktop. Touch screens keep their native scroll.
  // Add ?nosmooth to the address to switch it off when testing.
  useEffect(() => {
    if (reduce || window.location.search.includes('nosmooth')) return
    const lenis = new Lenis({ lerp: 0.1 })
    window.__lenis = lenis
    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    })
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      delete window.__lenis
    }
  }, [reduce])

  useEffect(() => {
    visits.current += 1
    const lenis = window.__lenis
    if (loc.hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(loc.hash.slice(1))
        if (!el) return
        if (lenis) lenis.scrollTo(el, { immediate: true })
        else el.scrollIntoView()
      })
    } else if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [loc.pathname, loc.hash])

  return (
    <>
      <Seo />
      <SoundScape />
      <Cursor />
      <Nav />
      {/* A coloured curtain lifts off each new page. */}
      {!reduce && visits.current > 0 && (
        <motion.div
          key={`curtain${loc.pathname}`}
          className={`curtain bg-${CURTAIN[visits.current % 4]}`}
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
        />
      )}
      <main key={loc.pathname}>
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {loc.pathname !== '/contact' && <Closing />}
      <footer className="footer">
        <div className="footer-brand">
          <Logo onDark />
          <p>{TAGLINE}</p>
        </div>
        <nav aria-label="Pages">
          <Link to="/services">Services</Link>
          <Link to="/work">Work</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>
        <address>
          <a href={`tel:${CONTACT.tel}`}>{CONTACT.phone}</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <span>{CONTACT.address}</span>
        </address>
      </footer>
      <Buddy />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <OrderProvider>
        <Shell />
      </OrderProvider>
    </BrowserRouter>
  )
}
