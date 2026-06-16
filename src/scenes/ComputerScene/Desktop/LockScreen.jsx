import React from 'react'
import './LockScreen.css'

/**
 * LockScreen
 * macOS-style login shown when the desktop first appears. Clicking "log in" is
 * the user gesture that unlocks audio (startup chime) and reveals the desktop.
 *
 * Props:
 *   onLogin {function} — proceed to the desktop
 */
export default function LockScreen({ onLogin }) {
  return (
    <div className="lock-screen" onClick={onLogin}>
      <div className="lock-inner">
        <div className="lock-avatar">SK</div>
        <p className="lock-name">Shreyas Kumar</p>
        <button type="button" className="lock-login" onClick={onLogin}>
          Click to log in
        </button>
      </div>
      <p className="lock-hint">AI Engineer · builder of real systems</p>
    </div>
  )
}
