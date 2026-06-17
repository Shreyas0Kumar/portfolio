import React from 'react'
import { usePortfolio } from '../../../data/portfolio.jsx'
import './LockScreen.css'

/**
 * LockScreen
 * macOS-style login shown when the desktop first appears. Clicking "log in" is
 * the user gesture that unlocks audio (startup chime) and reveals the desktop.
 * Name / role come from public/portfolio.json.
 *
 * Props:
 *   onLogin {function} — proceed to the desktop
 */
const initials = name =>
  (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function LockScreen({ onLogin }) {
  const { profile } = usePortfolio()
  return (
    <div className="lock-screen" onClick={onLogin}>
      <div className="lock-inner">
        <div className="lock-avatar">{initials(profile.name)}</div>
        <p className="lock-name">{profile.name}</p>
        <button type="button" className="lock-login" onClick={onLogin}>
          Click to log in
        </button>
      </div>
      <p className="lock-hint">{profile.role} · {profile.location}</p>
    </div>
  )
}
