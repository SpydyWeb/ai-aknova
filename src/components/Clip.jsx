import { useState } from 'react'
import { mediaUrl } from '../data.js'

// Plays a silent looping video chosen in the admin panel. Until one is chosen nothing is drawn,
// and the section around it closes the gap (see `:has(.clip)` in styles.css).
export default function Clip({ file, label, className = '' }) {
  const [missing, setMissing] = useState(false)
  if (missing || !file) return null
  return (
    <video
      className={`clip ${className}`}
      src={mediaUrl(file)}
      aria-label={label}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setMissing(true)}
    />
  )
}
