import React from 'react'
import XPLoader from './XPLoader/XPLoader.jsx'
import Desktop  from './Desktop/Desktop.jsx'

export default function ComputerScene({ phase, startLoggedIn, onLoadDone, onExit }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }}>
      {phase === 'loading' && (
        <XPLoader onDone={onLoadDone} />
      )}
      {phase === 'desktop' && (
        <Desktop onExit={onExit} startLoggedIn={startLoggedIn} />
      )}
    </div>
  )
}
