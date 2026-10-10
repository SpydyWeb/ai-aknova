// Every sound on the site is synthesised here from oscillators and noise. There are no audio files.
// Sound is always on, but browsers only allow audio after the visitor's first click, tap or key press,
// so nothing can play before `unlock()` has run.
let ctx = null
let master = null
let unlocked = false
let noiseBuf = null

// C major pentatonic, two octaves: any two of these sound fine together.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51]
function noise() {
  if (noiseBuf) return noiseBuf
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noiseBuf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noiseBuf
}

function tone(freq, { len = 0.09, type = 'sine', gain = 0.13, to = freq, at = 0, attack = 0.004 } = {}) {
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + len)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + len + 0.02)
}

function hiss({ len = 0.2, gain = 0.1, from = 800, to = 4000, at = 0 } = {}) {
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const g = ctx.createGain()
  src.buffer = noise()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + len)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  src.connect(filter).connect(g).connect(master)
  src.start(t, Math.random())
  src.stop(t + len + 0.02)
}

let clickStep = 0
const SOUNDS = {
  // Controls
  tap: () => tone(520, { len: 0.06, type: 'triangle', to: 340 }),
  key: () => {
    tone(180, { len: 0.05, type: 'square', gain: 0.07 })
    tone(1250, { len: 0.07, type: 'triangle', gain: 0.07, at: 0.02 })
  },
  type: () => tone(900 + Math.random() * 500, { len: 0.03, type: 'triangle', gain: 0.03 }),
  // A click on empty space plays the next note of a little tune.
  note: () => {
    const f = SCALE[clickStep++ % SCALE.length]
    tone(f, { len: 0.28, gain: 0.11 })
    tone(f * 2, { len: 0.18, gain: 0.03, at: 0.01 })
  },
  // Pointer
  hover: () => tone(1500 + Math.random() * 500, { len: 0.035, gain: 0.028, to: 1900 }),
  // Things on the page
  pop: () => tone(260, { len: 0.14, to: 880, gain: 0.16 }),
  print: () => [0, 0.05, 0.1].forEach((at) => hiss({ len: 0.04, gain: 0.07, from: 2500, to: 3500, at })),
  swish: () => hiss({ len: 0.22, gain: 0.09, from: 600, to: 3200 }),
  flip: () => {
    hiss({ len: 0.1, gain: 0.06, from: 1500, to: 600 })
    tone(420, { len: 0.07, type: 'triangle', to: 620, at: 0.08, gain: 0.08 })
  },
  whoosh: () => hiss({ len: 0.55, gain: 0.12, from: 300, to: 5000 }),
  ding: () => [660, 880, 1320].forEach((f, i) => tone(f, { len: 0.35, gain: 0.1, at: i * 0.09 })),
  buzz: () => tone(140, { len: 0.22, type: 'sawtooth', gain: 0.08, to: 90 }),
  coin: () => {
    tone(988, { len: 0.07, type: 'square', gain: 0.06 })
    tone(1319, { len: 0.25, type: 'square', gain: 0.06, at: 0.07 })
  },
  open: () => tone(300, { len: 0.12, to: 600, type: 'triangle', gain: 0.07 }),
  close: () => tone(600, { len: 0.12, to: 300, type: 'triangle', gain: 0.07 }),
  // Moving between pages
  page: () => {
    hiss({ len: 0.4, gain: 0.07, from: 400, to: 2600 })
    tone(392, { len: 0.3, gain: 0.05, at: 0.12 })
    tone(587.33, { len: 0.4, gain: 0.05, at: 0.22 })
  },
}

export function play(name, arg) {
  if (!unlocked || !SOUNDS[name]) return
  try {
    if (ctx.state === 'suspended' && !document.hidden) ctx.resume()
    SOUNDS[name](arg)
  } catch {
    /* audio unavailable: stay silent */
  }
}

/* ---------- a section coming into view ---------- */
// Each section down the page gets the next note up, so scrolling plays a rising phrase.
export function chime(step) {
  if (!unlocked) return
  const f = SCALE[step % SCALE.length] / 2
  tone(f, { len: 1.1, gain: 0.03, attack: 0.06 })
  tone(f * 1.5, { len: 0.9, gain: 0.015, at: 0.1, attack: 0.06 })
}

/* ---------- switching on ---------- */
export function unlock() {
  if (unlocked) return
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    const squash = ctx.createDynamicsCompressor()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(squash).connect(ctx.destination)
    unlocked = true
    // Go quiet when the tab is in the background.
    document.addEventListener('visibilitychange', () => (document.hidden ? ctx.suspend() : ctx.resume()))
  } catch {
    /* audio unavailable: stay silent */
  }
}
