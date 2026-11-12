import { SITE_INFO } from '../data.js'

// Picked once per page load, so it stays the same while the visitor moves between pages.
let days = null
const pick = (lo, hi) => (days ??= lo + Math.floor(Math.random() * (hi - lo + 1)))

// "Last project delivered 4 days ago. 2 projects in the queue." Numbers are set in the admin panel.
export default function Status({ className = '' }) {
  const s = SITE_INFO.status
  if (!s.show) return null
  const lo = Math.max(0, Number(s.minDays) || 0)
  const hi = Math.max(lo, Number(s.maxDays) || lo)
  const d = pick(lo, hi)
  const q = Math.max(0, Number(s.queue) || 0)
  return (
    <p className={`status-line ${className}`}>
      <span className="status-dot" aria-hidden="true" />
      Last project delivered {d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`}. {q} {q === 1 ? 'project' : 'projects'} in the queue.
    </p>
  )
}
