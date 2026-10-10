import { useState } from 'react'
import { mediaUrl } from '../data.js'

// Plays a silent looping video chosen in the admin panel. Until one is chosen it shows a labelled slot.
export default function Clip({ file, label, className = '' }) {
  const [missing, setMissing] = useState(false)
  if (missing || !file) {
    return (
      <span className={`clip clip-empty ${className}`}>
        <i aria-hidden="true" />
        <span>{label}</span>
        <small>Choose a video for this spot in the admin panel</small>
      </span>
    )
  }
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
