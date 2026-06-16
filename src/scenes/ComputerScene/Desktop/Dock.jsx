import React, { useRef } from 'react'
import './Dock.css'

/**
 * Dock
 * macOS-style dock with cursor magnification. Click an icon to open that app
 * (or focus it if already open). Open apps show an indicator dot.
 *
 * Props:
 *   apps      {Array}    — [{ id, name, icon, iconClass } | { divider: true }]
 *   openIds   {string[]} — ids of currently-open apps
 *   focusedId {string}   — id of the frontmost app
 *   onOpen    {function} — (id) => void
 */
export default function Dock({ apps, openIds, focusedId, onOpen }) {
  const iconRefs = useRef([])

  // Magnify icons based on horizontal distance from the cursor. Done with
  // direct style writes (not React state) so it's smooth.
  const onMove = e => {
    iconRefs.current.forEach(el => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const center = r.left + r.width / 2
      const dist = Math.abs(e.clientX - center)
      const scale = 1 + 0.55 * Math.max(0, 1 - dist / 130)
      el.style.transform = `translateY(${-12 * (scale - 1)}px) scale(${scale})`
    })
  }

  const reset = () => {
    iconRefs.current.forEach(el => { if (el) el.style.transform = '' })
  }

  return (
    <div className="dock" onMouseMove={onMove} onMouseLeave={reset}>
      {apps.map((app, i) => {
        if (app.divider) return <span key={`div-${i}`} className="dock-divider" />

        const open = openIds.includes(app.id)
        return (
          <button
            key={app.id}
            type="button"
            className="dock-item"
            onClick={() => onOpen(app.id)}
            aria-label={app.name}
          >
            <span className="dock-tooltip">{app.name}</span>
            <span
              ref={el => { iconRefs.current[i] = el }}
              className={`dock-icon${app.iconClass ? ` ${app.iconClass}` : ''}`}
            >
              {app.icon}
            </span>
            <span
              className={`dock-dot${open ? ' on' : ''}${focusedId === app.id ? ' focused' : ''}`}
            />
          </button>
        )
      })}
    </div>
  )
}
