import { Link } from 'react-router-dom'
import light from '../assets/logo-light.png'
import dark from '../assets/logo-dark.png'
import { SITE_INFO } from '../data.js'

// The Aknova Tech wordmark. `dark` is the version for black backgrounds.
export default function Logo({ onDark = false }) {
  return (
    <Link className={`logo ${onDark ? 'logo-on-dark' : ''}`} to="/" aria-label={`${SITE_INFO.name}, home`}>
      <img src={onDark ? dark : light} alt="" width="682" height="76" />
    </Link>
  )
}
