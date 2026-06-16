// chessEngine.js — a compact but complete chess engine.
// Uppercase = white, lowercase = black, null = empty.
// board[0] is rank 8 (black back rank); board[7] is rank 1 (white back rank).

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
const KINGDIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const QUEEN = [...BISHOP, ...ROOK]

export const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8
export const isW = p => p && p === p.toUpperCase()
export const cOf = p => (p ? (isW(p) ? 'w' : 'b') : null)
const cloneBoard = b => b.map(row => row.slice())

export function initialState() {
  const board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
  ]
  return { board, turn: 'w', castling: { K: true, Q: true, k: true, q: true }, ep: null }
}

// Is square (r,c) attacked by side `by`? Pattern-based (no recursion).
export function isAttacked(board, r, c, by) {
  // Pawns
  const pr = by === 'w' ? r + 1 : r - 1
  for (const pc of [c - 1, c + 1]) {
    if (inB(pr, pc)) {
      const q = board[pr][pc]
      if (q && cOf(q) === by && q.toLowerCase() === 'p') return true
    }
  }
  // Knights
  for (const [dr, dc] of KNIGHT) {
    const tr = r + dr, tc = c + dc
    if (inB(tr, tc)) {
      const q = board[tr][tc]
      if (q && cOf(q) === by && q.toLowerCase() === 'n') return true
    }
  }
  // King
  for (const [dr, dc] of KINGDIRS) {
    const tr = r + dr, tc = c + dc
    if (inB(tr, tc)) {
      const q = board[tr][tc]
      if (q && cOf(q) === by && q.toLowerCase() === 'k') return true
    }
  }
  // Sliding: bishops/queens (diagonal), rooks/queens (orthogonal)
  const scan = (dirs, types) => {
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc
      while (inB(tr, tc)) {
        const q = board[tr][tc]
        if (q) {
          if (cOf(q) === by && types.includes(q.toLowerCase())) return true
          break
        }
        tr += dr; tc += dc
      }
    }
    return false
  }
  if (scan(BISHOP, ['b', 'q'])) return true
  if (scan(ROOK, ['r', 'q'])) return true
  return false
}

export function kingInCheck(board, color) {
  const king = color === 'w' ? 'K' : 'k'
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === king)
        return isAttacked(board, r, c, color === 'w' ? 'b' : 'w')
  return false
}

// Pseudo-legal moves for the piece at (r,c) — not yet filtered for self-check.
function genPiece(state, r, c) {
  const { board, ep } = state
  const p = board[r][c]
  if (!p) return []
  const color = cOf(p)
  const enemy = color === 'w' ? 'b' : 'w'
  const type = p.toLowerCase()
  const moves = []
  const add = (tr, tc, flags = {}) =>
    moves.push({ from: [r, c], to: [tr, tc], piece: p, captured: board[tr][tc], ...flags })

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1
    const startRow = color === 'w' ? 6 : 1
    const promoRow = color === 'w' ? 0 : 7
    const addPromo = (tr, tc, cap) => {
      for (const pr of ['q', 'r', 'b', 'n'])
        moves.push({
          from: [r, c], to: [tr, tc], piece: p,
          captured: cap, promo: color === 'w' ? pr.toUpperCase() : pr,
        })
    }
    // forward
    if (inB(r + dir, c) && !board[r + dir][c]) {
      if (r + dir === promoRow) addPromo(r + dir, c, null)
      else add(r + dir, c)
      if (r === startRow && !board[r + 2 * dir][c]) add(r + 2 * dir, c, { double: true })
    }
    // captures + en passant
    for (const dc of [-1, 1]) {
      const tr = r + dir, tc = c + dc
      if (!inB(tr, tc)) continue
      const tgt = board[tr][tc]
      if (tgt && cOf(tgt) === enemy) {
        if (tr === promoRow) addPromo(tr, tc, tgt)
        else add(tr, tc)
      } else if (ep && ep[0] === tr && ep[1] === tc) {
        moves.push({ from: [r, c], to: [tr, tc], piece: p, captured: board[r][tc], ep: true })
      }
    }
  } else if (type === 'n') {
    for (const [dr, dc] of KNIGHT) {
      const tr = r + dr, tc = c + dc
      if (inB(tr, tc) && cOf(board[tr][tc]) !== color) add(tr, tc)
    }
  } else if (type === 'k') {
    for (const [dr, dc] of KINGDIRS) {
      const tr = r + dr, tc = c + dc
      if (inB(tr, tc) && cOf(board[tr][tc]) !== color) add(tr, tc)
    }
    addCastling(state, r, c, color, moves)
  } else {
    const dirs = type === 'b' ? BISHOP : type === 'r' ? ROOK : QUEEN
    for (const [dr, dc] of dirs) {
      let tr = r + dr, tc = c + dc
      while (inB(tr, tc)) {
        if (!board[tr][tc]) add(tr, tc)
        else { if (cOf(board[tr][tc]) === enemy) add(tr, tc); break }
        tr += dr; tc += dc
      }
    }
  }
  return moves
}

function addCastling(state, r, c, color, moves) {
  const { board, castling } = state
  const enemy = color === 'w' ? 'b' : 'w'
  const row = color === 'w' ? 7 : 0
  if (r !== row || c !== 4) return
  if (isAttacked(board, row, 4, enemy)) return // can't castle out of check
  const kRight = color === 'w' ? castling.K : castling.k
  const qRight = color === 'w' ? castling.Q : castling.q
  // King-side: f,g empty; king passes e,f,g unattacked
  if (kRight && !board[row][5] && !board[row][6] &&
      !isAttacked(board, row, 5, enemy) && !isAttacked(board, row, 6, enemy)) {
    moves.push({ from: [r, c], to: [row, 6], piece: board[r][c], captured: null, castle: 'K' })
  }
  // Queen-side: b,c,d empty; king passes e,d,c unattacked
  if (qRight && !board[row][1] && !board[row][2] && !board[row][3] &&
      !isAttacked(board, row, 3, enemy) && !isAttacked(board, row, 2, enemy)) {
    moves.push({ from: [r, c], to: [row, 2], piece: board[r][c], captured: null, castle: 'Q' })
  }
}

export function applyMove(state, m) {
  const board = cloneBoard(state.board)
  const castling = { ...state.castling }
  const [fr, fc] = m.from
  const [tr, tc] = m.to
  const p = board[fr][fc]

  board[fr][fc] = null
  if (m.ep) board[fr][tc] = null
  board[tr][tc] = m.promo || p

  if (m.castle === 'K') { board[tr][5] = board[tr][7]; board[tr][7] = null }
  if (m.castle === 'Q') { board[tr][3] = board[tr][0]; board[tr][0] = null }

  // Update castling rights
  if (p === 'K') { castling.K = false; castling.Q = false }
  if (p === 'k') { castling.k = false; castling.q = false }
  if (fr === 7 && fc === 0) castling.Q = false
  if (fr === 7 && fc === 7) castling.K = false
  if (fr === 0 && fc === 0) castling.q = false
  if (fr === 0 && fc === 7) castling.k = false
  if (tr === 7 && tc === 0) castling.Q = false
  if (tr === 7 && tc === 7) castling.K = false
  if (tr === 0 && tc === 0) castling.q = false
  if (tr === 0 && tc === 7) castling.k = false

  const ep = m.double ? [(fr + tr) / 2, fc] : null
  return { board, turn: state.turn === 'w' ? 'b' : 'w', castling, ep }
}

export function legalMoves(state) {
  const { board, turn } = state
  const out = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && cOf(board[r][c]) === turn) {
        for (const m of genPiece(state, r, c)) {
          const ns = applyMove(state, m)
          if (!kingInCheck(ns.board, turn)) out.push(m)
        }
      }
    }
  }
  return out
}

// 'checkmate' | 'stalemate' | 'check' | 'normal'
export function statusOf(state) {
  const moves = legalMoves(state)
  const checked = kingInCheck(state.board, state.turn)
  if (moves.length === 0) return checked ? 'checkmate' : 'stalemate'
  return checked ? 'check' : 'normal'
}

// Greedy 1-ply AI with light tactical awareness + randomness.
export function aiMove(state) {
  const moves = legalMoves(state)
  if (!moves.length) return null
  const enemy = state.turn === 'w' ? 'b' : 'w'
  let best = null, bestScore = -Infinity
  for (const m of moves) {
    let s = 0
    if (m.captured) s += VALUE[m.captured.toLowerCase()] * 10
    if (m.promo) s += VALUE[m.promo.toLowerCase()] * 8
    const ns = applyMove(state, m)
    // Penalize hanging the moved piece on its landing square.
    if (isAttacked(ns.board, m.to[0], m.to[1], enemy)) {
      s -= VALUE[(m.promo || m.piece).toLowerCase()] * 9
    }
    const st = statusOf(ns)
    if (st === 'checkmate') s += 100000
    else if (st === 'check') s += 0.6
    s += Math.random() * 0.9
    if (s > bestScore) { bestScore = s; best = m }
  }
  return best
}

export const sqName = (r, c) => 'abcdefgh'[c] + (8 - r)
