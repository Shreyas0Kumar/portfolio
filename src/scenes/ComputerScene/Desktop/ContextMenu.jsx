import React, { useEffect } from 'react'
import './ContextMenu.css'

/**
 * ContextMenu
 * A small right-click menu anchored at (x, y).
 *
 * Props:
 *   x, y  {number}  — anchor position
 *   items {Array}   — [{ label, onClick } | { divider: true }]
 *   onClose{function}
 */
export default function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const close = () => onClose()
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [onClose])

  // Keep the menu on-screen.
  const left = Math.min(x, window.innerWidth - 200)
  const top = Math.min(y, window.innerHeight - 220)

  return (
    <ul className="context-menu" style={{ left, top }}>
      {items.map((item, i) =>
        item.divider ? (
          <li key={`d-${i}`} className="context-divider" />
        ) : (
          <li
            key={item.label}
            className="context-item"
            onClick={() => { onClose(); item.onClick() }}
          >
            {item.label}
          </li>
        )
      )}
    </ul>
  )
}
