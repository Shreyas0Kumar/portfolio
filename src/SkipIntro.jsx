import React from 'react'
import './SkipIntro.css'

/**
 * SkipIntro
 * Persistent top-right shortcut shown across the whole entry sequence — the F11
 * nudge, the live 3D room, and the boot loader — so a returning visitor can jump
 * straight to the logged-in desktop instead of sitting through the intro, the
 * lock screen and the first-visit tour. App hides it once the desktop is up
 * (there's nothing left to skip by then).
 *
 * Props:
 *   onSkip {function} — fast-forward to the logged-in desktop
 */
export default function SkipIntro({ onSkip }) {
  return (
    <button type="button" className="skip-intro" onClick={onSkip}>
      Skip intro
      <span className="skip-intro-arrow" aria-hidden="true">→</span>
    </button>
  )
}
