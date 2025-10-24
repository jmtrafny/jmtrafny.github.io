/**
 * Thin Chess Engine - 1×12 variant
 *
 * Rules:
 * - Board: 1 file of 12 ranks (indexed 0..11, top→bottom)
 * - Pieces: k (king ±1), r (rook slides), n (knight jumps ±2)
 * - Kings cannot move into check
 * - No legal moves + check = checkmate
 * - No legal moves + no check = stalemate (draw)
 */

export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n';
export type Piece = `${Side}${PieceType}`;
export type Cell = Piece | '.';
export type Board = Cell[];

export interface Position {
  board: Board;
  turn: Side;
}

export interface Move {
  from: number;
  to: number;
}

export const EMPTY: Cell = '.';

// Unicode chess symbols (kept for backward compatibility)
export const UNICODE: Record<Piece, string> = {
  wk: '\u2654',
  wr: '\u2656',
  wn: '\u2658',
  bk: '\u265A',
  br: '\u265C',
  bn: '\u265E',
};

// SVG piece images
export const PIECE_IMAGES: Record<Piece, string> = {
  wk: '/pieces/wk.svg',
  wr: '/pieces/wr.svg',
  wn: '/pieces/wn.svg',
  bk: '/pieces/bk.svg',
  br: '/pieces/br.svg',
  bn: '/pieces/bn.svg',
};

// Default starting position
export const START_CODE = 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w';

/**
 * Position encoding/decoding
 * Format: "cell,cell,...,cell:side"
 * cell = 'x' (empty) or '[wb][krn]' (piece)
 * side = 'w' or 'b'
 */
export function decode(code: string): Position {
  const [cells, turnRaw] = code.trim().split(':');
  const items = cells.split(',').map(s => s.trim());

  if (items.length !== 12) {
    throw new Error('Need 12 comma-separated squares');
  }

  const board: Board = items.map(s => {
    if (s === 'x') return EMPTY;
    if (!/^[wb][krn]$/.test(s)) throw new Error(`Bad token: ${s}`);
    return s as Piece;
  });

  const turn: Side = (turnRaw || 'w').trim() === 'b' ? 'b' : 'w';

  return { board, turn };
}

export function encode(pos: Position): string {
  const cells = pos.board.map(p => p === EMPTY ? 'x' : p).join(',');
  return `${cells}:${pos.turn}`;
}

/**
 * Helper functions
 */
export function inBounds(i: number): boolean {
  return i >= 0 && i < 12;
}

export function sideOf(piece: Cell): Side | null {
  if (piece === EMPTY) return null;
  return piece[0] as Side;
}

export function typeOf(piece: Cell): PieceType | null {
  if (piece === EMPTY) return null;
  return piece[1] as PieceType;
}

export function findKing(board: Board, side: Side): number {
  const king: Piece = `${side}k`;
  for (let i = 0; i < 12; i++) {
    if (board[i] === king) return i;
  }
  return -1;
}

/**
 * Attack detection: Is square idx attacked by opponent?
 */
export function attacked(board: Board, side: Side, idx: number): boolean {
  const opp: Side = side === 'w' ? 'b' : 'w';

  // Opponent king ±1
  for (const d of [-1, 1]) {
    const j = idx + d;
    if (inBounds(j) && board[j] === `${opp}k`) return true;
  }

  // Opponent knight ±2
  for (const d of [-2, 2]) {
    const j = idx + d;
    if (inBounds(j) && board[j] === `${opp}n`) return true;
  }

  // Opponent rook (sliding rays)
  for (const d of [-1, 1]) {
    let j = idx + d;
    while (inBounds(j)) {
      const p = board[j];
      if (p !== EMPTY) {
        if (p === `${opp}r`) return true;
        break;
      }
      j += d;
    }
  }

  return false;
}

/**
 * Generate all legal moves for current position
 */
export function legalMoves(pos: Position): Move[] {
  const { board, turn } = pos;
  const moves: Move[] = [];

  for (let i = 0; i < 12; i++) {
    const p = board[i];
    if (p === EMPTY) continue;
    if (sideOf(p) !== turn) continue;

    const t = typeOf(p);

    if (t === 'k') {
      // King moves ±1
      for (const d of [-1, 1]) {
        const j = i + d;
        if (!inBounds(j)) continue;
        const q = board[j];
        if (q !== EMPTY && sideOf(q) === turn) continue;
        if (!wouldExposeKing({ from: i, to: j })) {
          moves.push({ from: i, to: j });
        }
      }
    } else if (t === 'n') {
      // Knight jumps ±2
      for (const d of [-2, 2]) {
        const j = i + d;
        if (!inBounds(j)) continue;
        const q = board[j];
        if (q !== EMPTY && sideOf(q) === turn) continue;
        if (!wouldExposeKing({ from: i, to: j })) {
          moves.push({ from: i, to: j });
        }
      }
    } else if (t === 'r') {
      // Rook slides ±1 direction
      for (const d of [-1, 1]) {
        let j = i + d;
        while (inBounds(j)) {
          const q = board[j];
          if (q === EMPTY) {
            if (!wouldExposeKing({ from: i, to: j })) {
              moves.push({ from: i, to: j });
            }
          } else {
            if (sideOf(q) !== turn) {
              if (!wouldExposeKing({ from: i, to: j })) {
                moves.push({ from: i, to: j });
              }
            }
            break;
          }
          j += d;
        }
      }
    }
  }

  return moves;

  function wouldExposeKing(m: Move): boolean {
    const nb = board.slice();
    nb[m.to] = nb[m.from];
    nb[m.from] = EMPTY;
    const kIdx = findKing(nb, turn);
    return attacked(nb, turn, kIdx);
  }
}

/**
 * Apply a move and return new position
 */
export function applyMove(pos: Position, m: Move): Position {
  const nb = pos.board.slice();
  nb[m.to] = nb[m.from];
  nb[m.from] = EMPTY;
  return {
    board: nb,
    turn: pos.turn === 'w' ? 'b' : 'w',
  };
}

/**
 * Check if current side is in check
 */
export function isCheck(pos: Position): boolean {
  const kIdx = findKing(pos.board, pos.turn);
  return attacked(pos.board, pos.turn, kIdx);
}

/**
 * Terminal state detection
 * Returns: null (non-terminal) | 'STALEMATE' | 'WHITE_MATE' | 'BLACK_MATE'
 */
export function terminal(pos: Position): string | null {
  const moves = legalMoves(pos);
  if (moves.length > 0) return null; // non-terminal

  // No legal moves
  if (isCheck(pos)) {
    return pos.turn === 'w' ? 'WHITE_MATE' : 'BLACK_MATE';
  }

  return 'STALEMATE';
}
