import React, { useState, useEffect } from 'react'
import './Stickies.css'

/**
 * Stickies
 * A single editable sticky note pinned to the desktop. Content persists in
 * localStorage. Doubles as a friendly "currently / availability" widget.
 */
const KEY = 'shreyas-sticky-v1'
const DEFAULT = `Currently —

• open to AI/ML eng roles
• building things that ship

(this note is editable!)`

export default function Stickies() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(KEY) ?? DEFAULT } catch { return DEFAULT }
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
