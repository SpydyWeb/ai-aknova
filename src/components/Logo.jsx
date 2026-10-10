import { Link } from 'react-router-dom'
import light from '../assets/logo-light.png'
import dark from '../assets/logo-dark.png'

// The Aknova Tech wordmark. `dark` is the version for black backgrounds.
export default function Logo({ onDark = false }) {
  return (
    <Link className={`logo ${onDark ? 'logo-on-dark' : ''}`} to="/" aria-label="Aknova Tech, home">
      <img src={onDark ? dark : light} alt="" width="682" height="76" />
    </Link>
  )
}
