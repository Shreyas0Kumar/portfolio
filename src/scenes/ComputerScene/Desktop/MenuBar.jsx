import React, { useState, useEffect } from 'react'
import './MenuBar.css'
import ControlCenter from './ControlCenter.jsx'

// Two stacked toggle pills — the macOS Control Center glyph.
const CONTROL_CENTER_ICON = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="5.4" rx="2.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="8.2" r="1.7" fill="currentColor" />
    <rect x="3" y="13.1" width="18" height="5.4" rx="2.7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16" cy="15.8" r="1.7" fill="currentColor" />
  </svg>
)

/**
 * MenuBar
 * Thin macOS-style top bar: Apple menu on the left, active app name, and a live
 * clock on the right.
 *
 * Props:
 *   activeAppName {string}   — bold name shown next to the Apple logo
 *   appleOpen     {boolean}  — whether the Apple dropdown is open
 *   onToggleApple {function} — toggle the Apple dropdown
 *   onAbout       {function} — open "About Me"
 *   onShutDown    {function} — shut down (back to the room)
 */
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function MenuBar({
  activeAppName,
  appleOpen,
  onToggleApple,
  onAbout,
  onShutDown,
  ccOpen,
  onToggleCC,
  controlCenter,
}) {
  const clock = useClock()

  return (
    <div className="menu-bar">
      <div className="menu-left">
        <button
          type="button"
          className={`menu-apple${appleOpen ? ' active' : ''}`}
          onClick={onToggleApple}
          aria-label="Apple menu"
        >
          <svg viewBox="0 0 814 1000" width="13" height="15" aria-hidden="true">
            <path
              fill="currentColor"
              d="M788 340c-6 5-115 66-115 202 0 158 139 214 143 215-1 3-22 76-73 150-46 65-93 130-165 130s-91-42-174-42c-81 0-110 43-176 43s-112-60-165-134C28 753 0 605 0 461 0 232 149 110 296 110c70 0 128 46 172 46 42 0 107-49 187-49 30 0 138 3 209 105zM554 64c33-39 56-93 56-147 0-7-1-15-2-21-53 2-116 36-154 80-30 34-58 88-58 143 0 8 1 16 2 19 3 1 9 2 14 2 48 0 108-32 142-76z"
            />
          </svg>
        </button>

        <span className="menu-appname">{activeAppName}</span>

        {appleOpen && (
          <div className="apple-menu" role="menu">
            <button type="button" className="apple-item" onClick={onAbout}>
              About Me
            </button>
            <div className="apple-divider" />
            <button type="button" className="apple-item" onClick={onShutDown}>
              Shut Down…
            </button>
          </div>
        )}
      </div>

      <div className="menu-right">
        <span className="menu-extra" title="Battery">🔋</span>
        <span className="menu-extra" title="Wi-Fi">{controlCenter.wifi ? '📶' : '🚫'}</span>
        <div className="menu-cc-wrap">
          <button
            type="button"
            className={`menu-extra menu-cc${ccOpen ? ' active' : ''}`}
            onClick={onToggleCC}
            aria-label="Control Center"
            aria-expanded={ccOpen}
            title="Control Center"
          >
            {CONTROL_CENTER_ICON}
          </button>
          {ccOpen && <ControlCenter {...controlCenter} />}
        </div>
        <span className="menu-clock">{clock}</span>
      </div>
    </div>
  )
}
