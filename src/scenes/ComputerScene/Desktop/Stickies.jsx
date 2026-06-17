import React, { useState, useEffect } from 'react'
import { usePortfolio } from '../../../data/portfolio.jsx'
import './Stickies.css'

/**
 * Stickies
 * A single editable sticky note pinned to the desktop. Content persists in
 * localStorage. Doubles as a friendly "currently / availability" widget; the
 * default text is seeded from public/portfolio.json.
 */
const KEY = 'shreyas-sticky-v1'

export default function Stickies() {
  const { profile } = usePortfolio()
  const fallback = `Currently —\n\n• ${profile.role}\n${profile.openToRelocate ? '• open to roles (will relocate)\n' : ''}• building things that ship\n\n(this note is editable!)`

  const [text, setText] = useState(() => {
    try { return localStorage.getItem(KEY) ?? fallback } catch { return fallback }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, text) } catch { /* ignore */ }
  }, [text])

  return (
    <div className="sticky" onMouseDown={e => e.stopPropagation()}>
      <div className="sticky-bar" />
      <textarea
        className="sticky-text"
        value={text}
        onChange={e => setText(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}
