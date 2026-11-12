import { Link } from 'react-router-dom'
import light from '../assets/logo-light.png'
import dark from '../assets/logo-dark.png'
import { SITE_INFO, mediaUrl } from '../data.js'

// The wordmark. `dark` is the version for black backgrounds. A logo uploaded under Site details
// replaces the built-in one; the dark spot falls back to it when no dark version is uploaded.
export default function Logo({ onDark = false }) {
  const custom = mediaUrl(onDark ? SITE_INFO.logoDark || SITE_INFO.logo : SITE_INFO.logo)
  return (
    <Link className={`logo ${onDark ? 'logo-on-dark' : ''}`} to="/" aria-label={`${SITE_INFO.name}, home`}>
      {custom ? <img src={custom} alt="" /> : <img src={onDark ? dark : light} alt="" width="682" height="76" />}
    </Link>
  )
}
