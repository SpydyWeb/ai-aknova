import { useState } from 'react'

// Plays a silent looping video from public/videos. Until the file exists it shows a labelled slot.
export default function Clip({ file, label, className = '' }) {
  const [missing, setMissing] = useState(false)
  if (missing) {
    return (
      <span className={`clip clip-empty ${className}`}>
        <i aria-hidden="true" />
        <span>{label}</span>
        <small>Add {file} to public/videos</small>
      </span>
    )
  }
  return (
    <video
      className={`clip ${className}`}
      src={`/videos/${file}`}
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
