import React, { useState } from 'react'
import './GamesApp.css'
import Chess  from './games/Chess.jsx'
import Sudoku from './games/Sudoku.jsx'

/**
 * GamesApp
 * A tiny arcade launcher: pick a game from the menu, play it, come back.
 */
const GAMES = [
  { id: 'chess',  name: 'Chess',  glyph: '♞', tint: '#3a3530', blurb: 'Play the engine or a friend. Full legal moves, castling, en passant.' },
  { id: 'sudoku', name: 'Sudoku', glyph: '#', tint: '#c8782a', blurb: 'Freshly generated puzzles with a guaranteed unique solution.' },
]

export default function GamesApp() {
  const [active, setActive] = useState(null)
  const game = GAMES.find(g => g.id === active)

  if (game) {
    const Comp = game.id === 'chess' ? Chess : Sudoku
    return (
      <div className="games">
        <div className="games-topbar">
          <button type="button" className="games-back" onClick={() => setActive(null)}>← Arcade</button>
          <span className="games-now">{game.glyph} {game.name}</span>
          <span className="games-spacer" />
        </div>
        <div className="games-stage">
          <Comp />
        </div>
      </div>
    )
  }

  return (
    <div className="games games-menu">
      <p className="games-eyebrow">Arcade</p>
      <h1 className="games-title">Pick a game.</h1>
      <div className="games-grid">
        {GAMES.map(g => (
          <button
            key={g.id}
            type="button"
            className="games-tile"
            onClick={() => setActive(g.id)}
          >
            <span className="games-tile-art" style={{ '--tint': g.tint }}>{g.glyph}</span>
            <span className="games-tile-name">{g.name}</span>
            <span className="games-tile-blurb">{g.blurb}</span>
            <span className="games-tile-play">Play →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
