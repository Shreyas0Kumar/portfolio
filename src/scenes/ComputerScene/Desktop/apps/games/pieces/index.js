// Kiwen Suwi chess piece set (v2.100) by neverRare.
// Artwork licensed CC BY 4.0 — https://github.com/neverRare/kiwen-suwi
// (see LICENSE-CC-BY-4.0.txt in this folder). Maps engine piece letters
// (uppercase = white, lowercase = black) to bundled SVG URLs.
import wK from './white-king.svg'
import wQ from './white-queen.svg'
import wR from './white-rook.svg'
import wB from './white-bishop.svg'
import wN from './white-knight.svg'
import wP from './white-pawn.svg'
import bK from './black-king.svg'
import bQ from './black-queen.svg'
import bR from './black-rook.svg'
import bB from './black-bishop.svg'
import bN from './black-knight.svg'
import bP from './black-pawn.svg'

export const PIECE_SVG = {
  K: wK, Q: wQ, R: wR, B: wB, N: wN, P: wP,
  k: bK, q: bQ, r: bR, b: bB, n: bN, p: bP,
}

const NAME = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }
export const pieceLabel = p =>
  `${p === p.toUpperCase() ? 'White' : 'Black'} ${NAME[p.toLowerCase()]}`

export const KIWEN_SUWI = {
  name: 'Kiwen Suwi',
  author: 'neverRare',
  url: 'https://github.com/neverRare/kiwen-suwi',
  license: 'CC BY 4.0',
}
