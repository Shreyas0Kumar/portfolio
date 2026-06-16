import React, { useEffect, useState } from 'react'
import './IntroScreen.css'

/**
 * IntroScreen
 * First thing on load: a full-bleed card nudging the visitor into full screen
 * for the best experience. Holds briefly, fades itself out, then calls onDone
 * so App can unmount it and reveal the live Spline room loading underneath.
 *
 * Props:
 *   onDone {function} — fired once the fade-out completes
 */

const HOLD_MS = 5000  // how long the message stays before fading
const FADE_MS = 1500  // fade-out duration (longer = smoother)

export default function IntroScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const hold = setTimeout(() => setFading(true), HOLD_MS)
    const done = setTimeout(() => onDone?.(), HOLD_MS + FADE_MS)
    return () => { clearTimeout(hold); clearTimeout(done) }
  }, [onDone])

  return (
    <div
      className={`intro-screen${fading ? ' fading' : ''}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      aria-hidden={fading}
    >
      <div className="intro-inner">
        <p className="intro-lead">for the best experience</p>
        <p className="intro-key">
          press <kbd>F11</kbd> to go full screen
        </p>
        <span className="intro-sub">
          entering the world
          <span className="intro-dots"><i>.</i><i>.</i><i>.</i></span>
        </span>
      </div>
    </div>
  )
}
