// Small synthesised sound effects. No audio files: every sound is built from oscillators and noise.
const KEY = 'anova-sound'
let ctx = null
let enabled = true
try {
  enabled = localStorage.getItem(KEY) !== 'off'
} catch {
  /* storage blocked: keep the default */
}

function tone(freq, { len = 0.09, type = 'sine', gain = 0.13, to = freq, at = 0 } = {}) {
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + len)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + len + 0.02)
}

function hiss({ len = 0.2, gain = 0.1, from = 800, to = 4000, at = 0 } = {}) {
  const t = ctx.currentTime + at
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const g = ctx.createGain()
  src.buffer = buf
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + len)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  src.connect(filter).connect(g).connect(ctx.destination)
  src.start(t)
}

const SOUNDS = {
  tap: () => tone(520, { len: 0.06, type: 'triangle', to: 340 }),
  pop: () => tone(260, { len: 0.14, to: 880, gain: 0.16 }),
  key: () => {
    tone(180, { len: 0.05, type: 'square', gain: 0.07 })
    tone(1250, { len: 0.07, type: 'triangle', gain: 0.07, at: 0.02 })
  },
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
}

export function play(name) {
  if (!enabled || !SOUNDS[name]) return
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    SOUNDS[name]()
  } catch {
    /* audio unavailable: stay silent */
  }
}

export const soundOn = () => enabled
export function setSound(v) {
  enabled = v
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off')
  } catch {
    /* storage blocked */
  }
  if (v) play('pop')
}
