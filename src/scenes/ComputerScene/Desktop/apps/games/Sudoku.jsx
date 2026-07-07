import React, { useEffect, useMemo, useState } from 'react'
import { generate } from './sudoku.js'
import { useSquareSize } from './useSquareSize.js'

const DIFFS = ['easy', 'medium', 'hard']

export default function Sudoku() {
  const [diff, setDiff]     = useState('easy')
  const [game, setGame]     = useState(() => generate('easy'))
  const [grid, setGrid]     = useState(() => game.puzzle.map(r => r.slice()))
  const [sel, setSel]       = useState(null) // [r,c]
  const [wrapRef, gridSize] = useSquareSize({ max: 460, min: 200 })

  const newGame = d => {
    const g = generate(d)
    setGame(g)
    setGrid(g.puzzle.map(r => r.slice()))
    setSel(null)
  }

  const given = (r, c) => game.puzzle[r][c] !== 0

  // Conflicts: a filled cell that clashes with another in row/col/box.
  const conflicts = useMemo(() => {
    const bad = new Set()
    const mark = cells => {
      const seen = {}
      for (const [r, c] of cells) {
        const v = grid[r][c]
        if (!v) continue
        if (seen[v]) { bad.add(seen[v]); bad.add(r * 9 + c) }
        else seen[v] = r * 9 + c
      }
    }
    for (let i = 0; i < 9; i++) {
      mark([...Array(9).keys()].map(j => [i, j]))           // row
      mark([...Array(9).keys()].map(j => [j, i]))           // col
    }
    for (let br = 0; br < 9; br += 3)
      for (let bc = 0; bc < 9; bc += 3) {
        const cells = []
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([br + i, bc + j])
        mark(cells)
      }
    return bad
  }, [grid])

  const filled = grid.every(row => row.every(v => v !== 0))
  const solved = filled && conflicts.size === 0

  // Keyboard input
  useEffect(() => {
    const onKey = e => {
      if (!sel) return
      const [r, c] = sel
      if (e.key >= '1' && e.key <= '9') { setCell(r, c, Number(e.key)) }
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(r, c, 0)
      else if (e.key === 'ArrowUp')    setSel([Math.max(0, r - 1), c])
      else if (e.key === 'ArrowDown')  setSel([Math.min(8, r + 1), c])
      else if (e.key === 'ArrowLeft')  setSel([r, Math.max(0, c - 1)])
      else if (e.key === 'ArrowRight') setSel([r, Math.min(8, c + 1)])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, grid])

  const setCell = (r, c, v) => {
    if (given(r, c) || solved) return
    setGrid(g => {
      const n = g.map(row => row.slice())
      n[r][c] = n[r][c] === v && v !== 0 ? 0 : v
      return n
    })
  }

  const selVal = sel ? grid[sel[0]][sel[1]] : 0
  const counts = useMemo(() => {
    const m = {}
    grid.forEach(row => row.forEach(v => { if (v) m[v] = (m[v] || 0) + 1 }))
    return m
  }, [grid])

  return (
    <div className="game-sudoku">
      <div className="sdk-bar">
        <span className={`sdk-status${solved ? ' win' : ''}`}>
          {solved ? '✓ Solved, nice!' : 'Fill every row, column & box with 1–9'}
        </span>
        <div className="sdk-actions">
          <div className="sdk-diffs">
            {DIFFS.map(d => (
              <button
                key={d}
                type="button"
                className={`sdk-diff${diff === d ? ' on' : ''}`}
                onClick={() => { setDiff(d); newGame(d) }}
              >{d}</button>
            ))}
          </div>
          <button type="button" className="sdk-new" onClick={() => newGame(diff)}>↻ New</button>
        </div>
      </div>

      <div className="sdk-gridwrap" ref={wrapRef}>
      <div
        className={`sdk-grid${solved ? ' solved' : ''}`}
        style={{ width: gridSize, height: gridSize, fontSize: `${gridSize / 16}px` }}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const isGiven = given(r, c)
            const isSel = sel && sel[0] === r && sel[1] === c
            const peer = sel && !isSel && (sel[0] === r || sel[1] === c ||
              (Math.floor(sel[0] / 3) === Math.floor(r / 3) && Math.floor(sel[1] / 3) === Math.floor(c / 3)))
            const same = v && v === selVal && !isSel
            const bad = conflicts.has(r * 9 + c)
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={
                  'sdk-cell' +
                  (isGiven ? ' given' : '') +
                  (isSel ? ' sel' : '') +
                  (peer ? ' peer' : '') +
                  (same ? ' same' : '') +
                  (bad ? ' bad' : '') +
                  (c % 3 === 2 && c !== 8 ? ' br' : '') +
                  (r % 3 === 2 && r !== 8 ? ' bb' : '')
                }
                onClick={() => setSel([r, c])}
              >
                {v !== 0 ? v : ''}
              </button>
            )
          })
        )}
      </div>
      </div>

      <div className="sdk-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            type="button"
            className={`sdk-key${counts[n] === 9 ? ' done' : ''}`}
            onClick={() => sel && setCell(sel[0], sel[1], n)}
          >{n}</button>
        ))}
        <button
          type="button"
          className="sdk-key erase"
          onClick={() => sel && setCell(sel[0], sel[1], 0)}
        >⌫</button>
      </div>
    </div>
  )
}
