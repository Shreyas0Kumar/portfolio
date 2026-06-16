import React, { useEffect, useState } from 'react'
import './XPLoader.css'

/**
 * XPLoader
 * Minimal dark boot screen. A single smooth progress fill plus cycling status
 * text, then hands off to the desktop.
 *
 * Props:
 *   onDone {function} — fired after ~2.8s
 */
const STATUSES = [
  'initializing...',
  'loading projects...',
  'brewing coffee...',
  'almost there...',
]

export default function XPLoader({ onDone }) {
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const cycle = setInterval(() => {
      setStatusIndex(i => (i + 1) % STATUSES.length)
    }, 700)

    const done = setTimeout(onDone, 2800)

    return () => {
      clearInterval(cycle)
      clearTimeout(done)
    }
  }, [onDone])

  return (
    <div className="xp-loader">
      <div className="xp-title">shreyas.dev</div>

      <div className="xp-bar">
        <div className="xp-bar-fill" />
      </div>

      <div className="xp-status">{STATUSES[statusIndex]}</div>
    </div>
  )
}
