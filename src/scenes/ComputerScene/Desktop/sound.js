/**
 * sound.js
 * Tiny Web Audio synth for subtle UI sounds — no audio files needed. All calls
 * are no-ops while muted, and the AudioContext is created lazily on first use
 * (after a user gesture) to satisfy autoplay policies.
 */
let ctx
let muted = false

const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) ctx = new AC()
  }
  return ctx
}

export const setMuted = m => { muted = m }
export const isMuted = () => muted

// `new AudioContext()` is a ~200ms synchronous hit. Construct it ahead of time
// during idle (no gesture needed — it just starts suspended) so the cost never
// lands on an interaction. Safe to call anytime.
export const primeAudio = () => { getCtx() }

// Resume on a user gesture. Cheap once primed (a few ms), so this is safe to
// call directly inside a click handler.
export const warmupAudio = () => {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
}

function tone(freq, dur = 0.08, type = 'sine', gain = 0.04, when = 0) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  try {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    o.connect(g)
    g.connect(c.destination)
    const t = c.currentTime + when
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t)
    o.stop(t + dur)
  } catch { /* ignore */ }
}

// Startup chime — a gentle major arpeggio.
export const chime = () => {
  ;[392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.5, 'triangle', 0.05, i * 0.12))
}

export const sOpen     = () => tone(660, 0.06, 'sine', 0.03)
export const sClose    = () => tone(330, 0.07, 'sine', 0.03)
export const sMinimize = () => tone(520, 0.05, 'sine', 0.025)
export const sPop      = () => tone(880, 0.04, 'triangle', 0.02)
export const sShutdown = () => { tone(440, 0.18, 'sine', 0.04); tone(220, 0.4, 'sine', 0.04, 0.12) }
