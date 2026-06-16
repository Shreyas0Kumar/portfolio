// sudoku.js — generate Sudoku puzzles with a guaranteed unique solution.

const clone = g => g.map(r => r.slice())

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValid(g, r, c, v) {
  for (let i = 0; i < 9; i++) {
    if (g[r][i] === v || g[i][c] === v) return false
  }
  const br = 3 * Math.floor(r / 3), bc = 3 * Math.floor(c / 3)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (g[br + i][bc + j] === v) return false
  return true
}

function fill(g) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r][c] === 0) {
        for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isValid(g, r, c, v)) {
            g[r][c] = v
            if (fill(g)) return true
            g[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

// Count solutions up to `cap` (stops early — we only care about uniqueness).
function countSolutions(g, cap = 2) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (g[r][c] === 0) {
        let total = 0
        for (let v = 1; v <= 9; v++) {
          if (isValid(g, r, c, v)) {
            g[r][c] = v
            total += countSolutions(g, cap - total)
            g[r][c] = 0
            if (total >= cap) return total
          }
        }
        return total
      }
    }
  }
  return 1
}

const TARGETS = { easy: 40, medium: 48, hard: 54 }

export function generate(difficulty = 'easy') {
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0))
  fill(solution)

  const puzzle = clone(solution)
  const target = TARGETS[difficulty] || 44
  let removed = 0

  for (const pos of shuffle([...Array(81).keys()])) {
    if (removed >= target) break
    const r = Math.floor(pos / 9), c = pos % 9
    if (puzzle[r][c] === 0) continue
    const saved = puzzle[r][c]
    puzzle[r][c] = 0
    if (countSolutions(clone(puzzle), 2) !== 1) {
      puzzle[r][c] = saved // removing it broke uniqueness — put it back
    } else {
      removed++
    }
  }

  return { puzzle, solution }
}
