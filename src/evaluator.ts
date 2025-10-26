/**
 * Position Evaluation for Heuristic Search
 *
 * Provides static position evaluation when perfect solving is infeasible.
 * Returns centipawn scores from side-to-move perspective.
 */

import { Position, EMPTY, typeOf, sideOf, getConfig, indexToCoords, type PieceType, type Side } from './engine';

// Material values in centipawns
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,   // Pawn
  n: 300,   // Knight
  b: 320,   // Bishop
  r: 500,   // Rook
  q: 900,   // Queen
  k: 0,     // King (invaluable)
};

// Piece-Square Tables (PST) bonuses for positional play
// Values are from white's perspective (rank 0 = top for black, rank N-1 = bottom for white)

// Pawn PST: Encourage advancement
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 10,
  5,  5, 10, 25, 25,  5,
  0,  0,  0, 20, 20,  0,
  5, -5,-10,  0,  0, -5,
];

// Knight PST: Prefer center
const KNIGHT_PST = [
  -50,-40,-30,-30,-40,-50,
  -40,-20,  0,  0,-20,-40,
  -30,  0, 10, 15, 10,-30,
  -30,  5, 15, 20, 15,-30,
  -40,-20,  0,  5,  0,-20,
  -50,-40,-30,-30,-40,-50,
];

// King PST (midgame): Stay safe, prefer back rank
const KING_PST_MG = [
  -30,-40,-40,-50,-40,-30,
  -30,-40,-40,-50,-40,-30,
  -30,-40,-40,-50,-40,-30,
  -30,-40,-40,-50,-40,-30,
  -20,-30,-30,-40,-30,-20,
   20, 20,  0,  0, 10, 20,
];

// King PST (endgame): Activate, prefer center
const KING_PST_EG = [
  -50,-40,-30,-20,-30,-40,
  -30,-20,-10,  0,-10,-20,
  -30,-10, 20, 30, 20,-10,
  -30,-10, 30, 40, 30,-10,
  -30,-10, 20, 30, 20,-10,
  -30,-30,  0,  0,  0,-30,
];

/**
 * Get piece-square table value for a given square
 * Returns value from white's perspective
 */
function getPSTValue(
  type: PieceType,
  side: Side,
  rank: number,
  file: number,
  boardHeight: number,
  boardWidth: number,
  isEndgame: boolean
): number {
  // Only apply PST for small boards (up to 6x6)
  if (boardHeight > 6 || boardWidth > 6) return 0;

  // Flip rank for black pieces
  const adjustedRank = side === 'w' ? (boardHeight - 1 - rank) : rank;

  // Scale PST index to 6x6 grid (our PST tables are for 6x6)
  const pstRank = Math.floor((adjustedRank * 6) / boardHeight);
  const pstFile = Math.floor((file * 6) / boardWidth);
  const pstIndex = pstRank * 6 + pstFile;

  let value = 0;
  switch (type) {
    case 'p':
      value = PAWN_PST[pstIndex] || 0;
      break;
    case 'n':
      value = KNIGHT_PST[pstIndex] || 0;
      break;
    case 'k':
      value = isEndgame ? (KING_PST_EG[pstIndex] || 0) : (KING_PST_MG[pstIndex] || 0);
      break;
    // Rook, Bishop, Queen: no PST (keep it simple)
    default:
      value = 0;
  }

  return side === 'w' ? value : -value;
}

/**
 * Detect if position is in endgame phase
 * Heuristic: endgame if queens are off or total material < 1300 centipawns per side
 */
function isEndgame(pos: Position): boolean {
  let totalMaterial = 0;
  let hasQueen = false;

  for (const piece of pos.board) {
    if (piece === EMPTY) continue;
    const type = typeOf(piece);
    if (!type) continue;
    if (type === 'q') hasQueen = true;
    totalMaterial += PIECE_VALUES[type] || 0;
  }

  return !hasQueen || totalMaterial < 2600;
}

/**
 * Evaluate position from side-to-move perspective
 * Returns centipawn score (positive = advantage for side to move)
 */
export function evaluate(pos: Position): number {
  const config = getConfig(pos);
  const endgame = isEndgame(pos);
  let score = 0;

  // Material and positional evaluation
  for (let i = 0; i < config.size; i++) {
    const piece = pos.board[i];
    if (piece === EMPTY) continue;

    const type = typeOf(piece);
    const side = sideOf(piece);
    if (!type || !side) continue;

    // Material value
    const materialValue = PIECE_VALUES[type as PieceType] || 0;

    // Positional value
    const [rank, file] = indexToCoords(i, config);
    const positionalValue = getPSTValue(type, side, rank, file, config.height, config.width, endgame);

    // Add to score (positive for side to move, negative for opponent)
    const totalValue = materialValue + positionalValue;
    if (side === pos.turn) {
      score += totalValue;
    } else {
      score -= totalValue;
    }
  }

  return score;
}

/**
 * Quick heuristic to estimate position complexity
 * Returns approximate number of half-moves to end of game
 * Used to decide which solver tier to use
 */
export function estimateComplexity(pos: Position): number {
  const config = getConfig(pos);
  const pieceCount = pos.board.filter(p => p !== EMPTY).length;
  const boardSize = config.size;

  // Heuristic: games tend to last ~40% of piece-count × board-factor moves
  const boardFactor = Math.sqrt(boardSize / 12); // Normalize to 1×12 baseline
  return Math.floor(pieceCount * boardFactor * 2);
}
