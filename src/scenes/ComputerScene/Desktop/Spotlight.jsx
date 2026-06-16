import React, { useState, useEffect, useRef } from 'react'
import './Spotlight.css'

/**
 * Spotlight
 * Centered search overlay (⌘/Ctrl + Space). Filters a flat list of items by
 * label; Enter runs the top match, arrow keys move, Esc closes.
 *
 * Props:
 *   items  {Array}    — [{ label, hint, run }]
 *   onClose{function} — close the overlay
 */
export default function Spotlight({ items, onClose }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim().toLowerCase()
  const results = q
    ? items.filter(it => it.label.toLowerCase().includes(q)).slice(0, 8)
    : items.slice(0, 6)

  useEffect(() => { setActive(0) }, [query])

  const run = item => {
    if (!item) return
    onClose()
    item.run()
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div className="spotlight-layer" onMouseDown={onClose}>
      <div className="spotlight" onMouseDown={e => e.stopPropagation()}>
        <div className="spotlight-search">
          <span className="spotlight-icon">🔍</span>
          <input
            ref={inputRef}
            className="spotlight-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Spotlight Search"
            spellCheck={false}
          />
        </div>

        {results.length > 0 && (
          <ul className="spotlight-results">
            {results.map((item, i) => (
              <li
                key={item.label}
                className={`spotlight-result${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(item)}
              >
                <span className="spotlight-result-label">{item.label}</span>
                {item.hint && <span className="spotlight-result-hint">{item.hint}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
