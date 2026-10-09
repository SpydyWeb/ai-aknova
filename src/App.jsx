import { useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import Nav from './components/Nav.jsx'
import Closing from './components/Closing.jsx'
import Cursor from './components/Cursor.jsx'
import Buddy from './components/Buddy.jsx'
import Home from './pages/Home.jsx'
import ServicesPage from './pages/ServicesPage.jsx'
import ServiceDetail from './pages/ServiceDetail.jsx'
import WorkPage from './pages/WorkPage.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import { Link } from 'react-router-dom'
import { EMAIL } from './data.js'
import { OrderProvider } from './ui.jsx'

const CURTAIN = ['sun', 'grape', 'mint', 'tangerine']

function Shell() {
  const loc = useLocation()
  const reduce = useReducedMotion()
  const visits = useRef(0)

  useEffect(() => {
    visits.current += 1
    if (loc.hash) requestAnimationFrame(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView())
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [loc.pathname, loc.hash])

  return (
    <>
      <Cursor />
      <Nav />
      {/* A coloured curtain lifts off each new page. */}
      {!reduce && visits.current > 0 && (
        <motion.div
          key={loc.pathname}
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
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {loc.pathname !== '/contact' && <Closing />}
      <footer className="footer">
        <Link className="logo" to="/">
          <span className="logo-mark" aria-hidden="true" />
          Anova AI
        </Link>
        <nav>
          <Link to="/services">Services</Link>
          <Link to="/work">Work</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </nav>
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
