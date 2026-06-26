import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initialState, legalMoves, applyMove, statusOf, aiMove, cOf } from './chessEngine.js'
import { useSquareSize } from './useSquareSize.js'
import { PIECE_SVG, pieceLabel, KIWEN_SUWI } from './pieces/index.js'

const sameSq = (a, b) => a && b && a[0] === b[0] && a[1] === b[1]

export default function Chess() {
  const [state, setState] = useState(() => initialState())
  const [mode, setMode]   = useState('ai')          // 'ai' | '2p'  (AI plays black)
  const [sel, setSel]     = useState(null)          // [r,c] selected
  const [last, setLast]   = useState(null)          // { from, to }
  const [captured, setCaptured] = useState({ w: [], b: [] })
  const aiTimer = useRef(null)
  const [wrapRef, boardSize] = useSquareSize({ max: 520, min: 200 })

  const moves = useMemo(() => legalMoves(state), [state])
  const status = useMemo(() => statusOf(state), [state])
  const gameOver = status === 'checkmate' || status === 'stalemate'

  // Legal destination squares for the selected piece.
  const targets = useMemo(
    () => (sel ? moves.filter(m => m.from[0] === sel[0] && m.from[1] === sel[1]) : []),
    [sel, moves]
  )

  const doMove = m => {
    setState(prev => {
      const ns = applyMove(prev, m)
      return ns
    })
    if (m.captured) {
      setCaptured(c => {
        const side = cOf(m.captured)
        return { ...c, [side]: [...c[side], m.captured] }
      })
    }
    setLast({ from: m.from, to: m.to })
    setSel(null)
  }

  // AI plays black in 'ai' mode.
  useEffect(() => {
    clearTimeout(aiTimer.current)
    if (mode === 'ai' && state.turn === 'b' && !gameOver) {
      aiTimer.current = setTimeout(() => {
        const m = aiMove(state)
        if (m) doMove(m)
      }, 480)
    }
    return () => clearTimeout(aiTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, gameOver])

  const onSquare = (r, c) => {
    if (gameOver) return
    if (mode === 'ai' && state.turn === 'b') return // not your turn
    const piece = state.board[r][c]

    // Completing a move?
    if (sel) {
      const hits = targets.filter(m => m.to[0] === r && m.to[1] === c)
      if (hits.length) {
        // Auto-queen on promotion.
        const m = hits.find(x => !x.promo || x.promo.toLowerCase() === 'q') || hits[0]
        doMove(m)
        return
      }
    }
    // Selecting own piece
    if (piece && cOf(piece) === state.turn) setSel([r, c])
    else setSel(null)
  }

  const reset = () => {
    clearTimeout(aiTimer.current)
    setState(initialState())
    setSel(null); setLast(null); setCaptured({ w: [], b: [] })
  }

  const turnLabel = state.turn === 'w' ? 'White' : 'Black'
  let banner
  if (status === 'checkmate') banner = `Checkmate — ${state.turn === 'w' ? 'Black' : 'White'} wins`
  else if (status === 'stalemate') banner = 'Stalemate — draw'
  else if (status === 'check') banner = `${turnLabel} to move — check!`
  else banner = `${turnLabel} to move`

  return (
    <div className="game-chess">
      <div className="chess-bar">
        <span className={`chess-status${status === 'check' ? ' warn' : ''}${gameOver ? ' over' : ''}`}>
          {banner}
        </span>
        <div className="chess-actions">
          <div className="chess-modes">
            <button
              type="button"
              className={`chess-mode${mode === 'ai' ? ' on' : ''}`}
              onClick={() => { setMode('ai'); reset() }}
            >vs Computer</button>
            <button
              type="button"
              className={`chess-mode${mode === '2p' ? ' on' : ''}`}
              onClick={() => { setMode('2p'); reset() }}
            >2 Players</button>
          </div>
          <button type="button" className="chess-reset" onClick={reset}>↻ New game</button>
        </div>
      </div>

      <div className="chess-captured">
        {captured.b.map((p, i) => (
          <img key={'b' + i} className="cap" src={PIECE_SVG[p]} alt={pieceLabel(p)} />
        ))}
      </div>

      <div className="chess-boardwrap" ref={wrapRef}>
      <div className="chess-board" style={{ width: boardSize, height: boardSize, '--sq': `${boardSize / 8}px` }}>
        {state.board.map((row, r) =>
          row.map((piece, c) => {
            const dark = (r + c) % 2 === 1
            const isSel = sameSq(sel, [r, c])
            const isTarget = targets.some(m => m.to[0] === r && m.to[1] === c)
            const isCapture = isTarget && (piece || targets.some(m => m.to[0] === r && m.to[1] === c && m.ep))
            const inLast = last && (sameSq(last.from, [r, c]) || sameSq(last.to, [r, c]))
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={
                  'chess-sq' +
                  (dark ? ' dark' : ' light') +
                  (isSel ? ' sel' : '') +
                  (inLast ? ' last' : '')
                }
                onClick={() => onSquare(r, c)}
              >
                {c === 0 && <span className="chess-coord rank">{8 - r}</span>}
                {r === 7 && <span className="chess-coord file">{'abcdefgh'[c]}</span>}
                {piece && (
                  <img
                    className={`chess-piece ${cOf(piece)}`}
                    src={PIECE_SVG[piece]}
                    alt={pieceLabel(piece)}
                    draggable={false}
                  />
                )}
                {isTarget && <span className={`chess-dot${isCapture ? ' cap' : ''}`} />}
              </button>
            )
          })
        )}
      </div>
      </div>

      <div className="chess-captured">
        {captured.w.map((p, i) => (
          <img key={'w' + i} className="cap" src={PIECE_SVG[p]} alt={pieceLabel(p)} />
        ))}
      </div>

      <p className="chess-credit">
        Pieces:{' '}
        <a href={KIWEN_SUWI.url} target="_blank" rel="noreferrer">
          {KIWEN_SUWI.name}
        </a>{' '}
        by {KIWEN_SUWI.author} · {KIWEN_SUWI.license}
      </p>
    </div>
  )
}
