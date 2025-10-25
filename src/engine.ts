/**
 * Chess Variants Engine - 1-D Chess (1×12) and Thin Chess (2×10)
 *
 * 1-D Chess Rules:
 * - Board: 1 file of 12 ranks (indexed 0..11, top→bottom)
 * - Pieces: k (king ±1), r (rook slides), n (knight jumps ±2)
 *
 * Thin Chess Rules:
 * - Board: 2 files of 10 ranks (2×10 grid, indexed row-major)
 * - Pieces: k (king 8-dir), r (rook orthogonal), n (knight L-shape), b (bishop diagonal), p (pawn)
 *
 * Common Rules:
 * - Kings cannot move into check
 * - No legal moves + check = checkmate
 * - No legal moves + no check = stalemate (draw)
 */

export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p' | 'q';
export type Piece = `${Side}${PieceType}`;
export type Cell = Piece | '.';
export type Board = Cell[];

export type VariantType = 'thin' | 'skinny';

export interface BoardConfig {
  variant: VariantType;
  width: number;    // 1 for thin, 2 for skinny
  height: number;   // 12 for thin, 10 for skinny
  size: number;     // total squares
  files: string[];  // ['a'] or ['a','b']
  ranks: number[];  // [1..12] or [1..10]
}

export const CONFIGS: Record<VariantType, BoardConfig> = {
  thin: {
    variant: 'thin',
    width: 1,
    height: 12,
    size: 12,
    files: ['a'],
    ranks: Array.from({ length: 12 }, (_, i) => i + 1),
  },
  skinny: {
    variant: 'skinny',
    width: 2,
    height: 10,
    size: 20,
    files: ['a', 'b'],
    ranks: Array.from({ length: 10 }, (_, i) => i + 1),
  },
};

/**
 * Get board configuration for a position.
 * Handles variable board dimensions for both variants.
 */
export function getConfig(pos: Position): BoardConfig {
  if (pos.variant === 'thin' && pos.boardLength && pos.boardLength !== 12) {
    // Custom 1-D Chess mode with non-standard length
    return {
      variant: 'thin',
      width: 1,
      height: pos.boardLength,
      size: pos.boardLength,
      files: ['a'],
      ranks: Array.from({ length: pos.boardLength }, (_, i) => i + 1),
    };
  }
  if (pos.variant === 'skinny' && (pos.boardWidth || pos.boardLength)) {
    // Custom Thin Chess mode with non-standard dimensions (e.g., 3×8)
    const width = pos.boardWidth || 2;
    const height = pos.boardLength || 10;
    const files = Array.from({ length: width }, (_, i) => String.fromCharCode(97 + i)); // 'a','b','c'...
    return {
      variant: 'skinny',
      width,
      height,
      size: width * height,
      files,
      ranks: Array.from({ length: height }, (_, i) => i + 1),
    };
  }
  return CONFIGS[pos.variant];
}

export interface Position {
  variant: VariantType;
  board: Board;
  turn: Side;
  boardLength?: number; // Optional: for custom board height (1-D: 6,7,8,9,10,12; Thin: 8,10,etc)
  boardWidth?: number;  // Optional: for custom board width (Thin Chess: 2 or 3)
}

export interface Move {
  from: number;
  to: number;
  promotion?: PieceType; // For pawn promotion
}

export const EMPTY: Cell = '.';

// Unicode chess symbols
export const UNICODE: Record<Piece, string> = {
  wk: '\u2654',
  wq: '\u2655',
  wr: '\u2656',
  wn: '\u2658',
  wb: '\u2657',
  wp: '\u2659',
  bk: '\u265A',
  bq: '\u265B',
  br: '\u265C',
  bn: '\u265E',
  bb: '\u265D',
  bp: '\u265F',
};

// SVG piece images
export const PIECE_IMAGES: Record<Piece, string> = {
  wk: '/pieces/wk.svg',
  wq: '/pieces/wq.svg',
  wr: '/pieces/wr.svg',
  wn: '/pieces/wn.svg',
  wb: '/pieces/wb.svg',
  wp: '/pieces/wp.svg',
  bk: '/pieces/bk.svg',
  bq: '/pieces/bq.svg',
  br: '/pieces/br.svg',
  bn: '/pieces/bn.svg',
  bb: '/pieces/bb.svg',
  bp: '/pieces/bp.svg',
};

// Starting positions for each variant
export const START_POSITIONS: Record<VariantType, string> = {
  thin: 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
  skinny: 'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w',
};

// Backward compatibility: default starting position for Thin Chess
export const START_CODE = START_POSITIONS.thin;

/**
 * NOTE: Game mode configuration has been moved to public/game-modes.json
 *
 * The SkinnyMode, ThinMode, ModeHelp interfaces and their associated
 * arrays (SKINNY_MODE_PACK, THIN_MODE_PACK, MINI_BOARD_PUZZLES_PACK, MODE_HELP_CONTENT)
 * have been removed in favor of a configuration-driven architecture.
 *
 * See:
 * - src/config/GameModeConfig.ts for type definitions
 * - src/config/loader.ts for configuration loading
 * - public/game-modes.json for all game mode data
 */

/**
 * @deprecated Legacy interface - use GameMode from src/config/GameModeConfig.ts instead
 */
export interface SkinnyMode {
  id: string;
  name: string;
  description: string;
  startPosition: string;
  rationale: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  boardWidth: number;
  boardLength: number;
}

/**
 * @deprecated Moved to public/game-modes.json
 */
export const SKINNY_MODE_PACK: SkinnyMode[] = [];

/**
 * 1-D Chess Mode Pack
 * Scenarios from "Interesting Starting Conditions for 1D Chess"
 */
export interface ThinMode {
  id: string;
  name: string;
  description: string;
  startPosition: string;
  boardLength: number;
  rationale: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}


/**
 * @deprecated Moved to public/game-modes.json
 */
export const THIN_MODE_PACK: ThinMode[] = [];

/**
 * @deprecated Moved to public/game-modes.json
 */
export const MINI_BOARD_PUZZLES_PACK: Array<ThinMode | SkinnyMode> = [];

/**
 * @deprecated Legacy interface - use ModeHelp from src/config/GameModeConfig.ts instead
 */
export interface ModeHelp {
  challenge: string;
  solvabilityType: 'FORCED_WIN_WHITE' | 'TACTICAL_PUZZLE' | 'COMPETITIVE' | 'DRAWISH';
  hints: string[];
  solution?: string;
  strategy?: {
    whitePlan: string;
    blackPlan: string;
    keyPositions: string;
  };
  learningObjectives: string[];
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  icon: string;
}

/**
 * @deprecated Moved to public/game-modes.json
 */
export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {};

// Convert flat index to 2D coordinates
export function indexToCoords(idx: number, config: BoardConfig): [number, number] {
  const rank = Math.floor(idx / config.width);
  const file = idx % config.width;
  return [rank, file];
}

// Convert 2D coordinates to flat index
export function coordsToIndex(rank: number, file: number, config: BoardConfig): number {
  return rank * config.width + file;
}

// Check if 2D coordinates are in bounds
export function inBounds2D(rank: number, file: number, config: BoardConfig): boolean {
  return rank >= 0 && rank < config.height && file >= 0 && file < config.width;
}

// Convert coordinates to algebraic notation
export function coordsToAlgebraic(rank: number, file: number, config: BoardConfig): string {
  return config.files[file] + (rank + 1);
}

/**
 * Position encoding/decoding
 * Thin format:  "cell,cell,...,cell:side" (comma-separated, flat)
 * Skinny format: "c,c/c,c/.../c,c:side" (ranks separated by /, cells by comma)
 * cell = 'x' (empty) or '[wb][krnbp]' (piece)
 * side = 'w' or 'b'
 */
export function decode(code: string, variant: VariantType, boardLength?: number, boardWidth?: number): Position {
  const [cellsRaw, turnRaw] = code.trim().split(':');

  // Parse cells first to determine actual board dimensions
  let items: string[];
  let detectedWidth: number | undefined;
  let detectedHeight: number | undefined;

  if (variant === 'thin') {
    // Thin: flat comma-separated
    items = cellsRaw.split(',').map(s => s.trim());
    detectedHeight = items.length;
  } else {
    // Skinny: ranks separated by '/', cells by ','
    const ranks = cellsRaw.split('/');
    detectedHeight = ranks.length;
    detectedWidth = ranks[0].split(',').length; // Width from first rank
    items = ranks.flatMap(rank => rank.split(',').map(s => s.trim()));
  }

  // Auto-detect dimensions if not provided
  if (variant === 'thin' && !boardLength) {
    boardLength = detectedHeight;
  }
  if (variant === 'skinny') {
    if (!boardWidth) boardWidth = detectedWidth;
    if (!boardLength) boardLength = detectedHeight;
  }

  // Build position object with detected/provided dimensions
  const pos: Position = {
    variant,
    board: [], // Will be filled below
    turn: (turnRaw || 'w').trim() === 'b' ? 'b' : 'w',
  };

  if (variant === 'thin' && boardLength) {
    pos.boardLength = boardLength;
  }
  if (variant === 'skinny') {
    if (boardWidth && boardWidth !== 2) pos.boardWidth = boardWidth;
    if (boardLength && boardLength !== 10) pos.boardLength = boardLength;
  }

  // Get config for validation
  const config = getConfig(pos);

  if (items.length !== config.size) {
    throw new Error(`Expected ${config.size} squares for ${variant}, got ${items.length}`);
  }

  pos.board = items.map(s => {
    if (s === 'x') return EMPTY;
    if (!/^[wb][krnbpq]$/.test(s)) throw new Error(`Bad token: ${s}`);
    return s as Piece;
  });

  return pos;
}

export function encode(pos: Position): string {
  const config = getConfig(pos);
  const cells = pos.board.map(p => p === EMPTY ? 'x' : p);

  let cellsStr: string;
  if (pos.variant === 'thin') {
    // Thin: flat comma-separated
    cellsStr = cells.join(',');
  } else {
    // Skinny: group by ranks, separate with '/'
    const ranks: string[] = [];
    for (let r = 0; r < config.height; r++) {
      const start = r * config.width;
      const end = start + config.width;
      const rankCells = cells.slice(start, end).join(',');
      ranks.push(rankCells);
    }
    cellsStr = ranks.join('/');
  }

  return `${cellsStr}:${pos.turn}`;
}

/**
 * Helper functions
 */
export function inBounds(i: number, config: BoardConfig): boolean {
  return i >= 0 && i < config.size;
}

export function sideOf(piece: Cell): Side | null {
  if (!piece || piece === EMPTY) return null;
  return piece[0] as Side;
}

export function typeOf(piece: Cell): PieceType | null {
  if (!piece || piece === EMPTY) return null;
  return piece[1] as PieceType;
}

export function findKing(board: Board, side: Side, config: BoardConfig): number {
  const king: Piece = `${side}k`;
  for (let i = 0; i < config.size; i++) {
    if (board[i] === king) return i;
  }
  return -1;
}

/**
 * Attack detection: Is square idx attacked by opponent?
 */
export function attacked(board: Board, side: Side, idx: number, config: BoardConfig): boolean {
  const opp: Side = side === 'w' ? 'b' : 'w';
  const [rank, file] = indexToCoords(idx, config);

  if (config.variant === 'thin') {
    // Thin Chess: 1D attacks
    // Opponent king ±1
    for (const d of [-1, 1]) {
      const j = idx + d;
      if (inBounds(j, config) && board[j] === `${opp}k`) return true;
    }

    // Opponent knight ±2
    for (const d of [-2, 2]) {
      const j = idx + d;
      if (inBounds(j, config) && board[j] === `${opp}n`) return true;
    }

    // Opponent rook (sliding rays)
    for (const d of [-1, 1]) {
      let j = idx + d;
      while (inBounds(j, config)) {
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}r`) return true;
          break;
        }
        j += d;
      }
    }
  } else {
    // Skinny Chess: 2D attacks
    // King attacks (8 directions)
    const kingDeltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, df] of kingDeltas) {
      const newRank = rank + dr;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}k`) return true;
      }
    }

    // Knight attacks (L-shapes)
    const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, df] of knightDeltas) {
      const newRank = rank + dr;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}n`) return true;
      }
    }

    // Rook attacks (orthogonal rays) - also check for queen
    const rookDeltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, df] of rookDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}r` || p === `${opp}q`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Bishop attacks (diagonal rays) - also check for queen
    const bishopDeltas = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, df] of bishopDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}b` || p === `${opp}q`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Pawn attacks (diagonal forward)
    const pawnDirection = side === 'w' ? -1 : 1;
    for (const df of [-1, 1]) {
      const newRank = rank + pawnDirection;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}p`) return true;
      }
    }
  }

  return false;
}

/**
 * Generate all legal moves for current position
 */
export function legalMoves(pos: Position): Move[] {
  const { board, turn, variant } = pos;
  const config = getConfig(pos);
  const moves: Move[] = [];

  for (let i = 0; i < config.size; i++) {
    const p = board[i];
    if (p === EMPTY) continue;
    if (sideOf(p) !== turn) continue;

    const t = typeOf(p);
    let pieceMoves: Move[] = [];

    if (variant === 'thin') {
      // Thin Chess: 1D movement
      if (t === 'k') {
        // King moves ±1
        for (const d of [-1, 1]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'n') {
        // Knight jumps ±2
        for (const d of [-2, 2]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'r') {
        // Rook slides ±1 direction
        for (const d of [-1, 1]) {
          let j = i + d;
          while (inBounds(j, config)) {
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            j += d;
          }
        }
      }
    } else {
      // Skinny Chess: 2D movement
      const [rank, file] = indexToCoords(i, config);

      if (t === 'k') {
        // King: 8 directions
        const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, df] of deltas) {
          const newRank = rank + dr;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'n') {
        // Knight: L-shapes
        const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, df] of deltas) {
          const newRank = rank + dr;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'r') {
        // Rook: orthogonal sliding
        const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, df] of deltas) {
          let r = rank + dr;
          let f = file + df;
          while (inBounds2D(r, f, config)) {
            const j = coordsToIndex(r, f, config);
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            r += dr;
            f += df;
          }
        }
      } else if (t === 'b') {
        // Bishop: diagonal sliding
        const deltas = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, df] of deltas) {
          let r = rank + dr;
          let f = file + df;
          while (inBounds2D(r, f, config)) {
            const j = coordsToIndex(r, f, config);
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            r += dr;
            f += df;
          }
        }
      } else if (t === 'q') {
        // Queen: rook + bishop (orthogonal + diagonal sliding)
        const queenDeltas = [
          [-1, 0], [1, 0], [0, -1], [0, 1],      // Rook moves
          [-1, -1], [-1, 1], [1, -1], [1, 1]     // Bishop moves
        ];
        for (const [dr, df] of queenDeltas) {
          let r = rank + dr;
          let f = file + df;
          while (inBounds2D(r, f, config)) {
            const j = coordsToIndex(r, f, config);
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            r += dr;
            f += df;
          }
        }
      } else if (t === 'p') {
        // Pawn: forward + diagonal captures + promotion
        const direction = turn === 'w' ? -1 : 1;
        const startRank = turn === 'w' ? (config.height - 2) : 1;
        const promotionRank = turn === 'w' ? 0 : (config.height - 1);

        // Forward move
        const oneStep = rank + direction;
        if (inBounds2D(oneStep, file, config)) {
          const j = coordsToIndex(oneStep, file, config);
          if (board[j] === EMPTY) {
            if (oneStep === promotionRank) {
              // Promotion (default to queen for now)
              pieceMoves.push({ from: i, to: j, promotion: 'r' as PieceType });
            } else {
              pieceMoves.push({ from: i, to: j });
            }

            // Double move from starting position
            if (rank === startRank) {
              const twoStep = rank + 2 * direction;
              const j2 = coordsToIndex(twoStep, file, config);
              if (board[j2] === EMPTY) {
                pieceMoves.push({ from: i, to: j2 });
              }
            }
          }
        }

        // Diagonal captures
        for (const df of [-1, 1]) {
          const newRank = rank + direction;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) !== turn) {
            if (newRank === promotionRank) {
              pieceMoves.push({ from: i, to: j, promotion: 'r' as PieceType });
            } else {
              pieceMoves.push({ from: i, to: j });
            }
          }
        }
      }
    }

    // Filter out moves that would leave king in check
    for (const m of pieceMoves) {
      if (!wouldExposeKing(m, board, turn, config)) {
        moves.push(m);
      }
    }
  }

  return moves;
}

function wouldExposeKing(m: Move, board: Board, turn: Side, config: BoardConfig): boolean {
  const nb = board.slice();
  nb[m.to] = nb[m.from];
  nb[m.from] = EMPTY;
  const kIdx = findKing(nb, turn, config);
  return attacked(nb, turn, kIdx, config);
}

/**
 * Apply a move and return new position
 */
export function applyMove(pos: Position, m: Move): Position {
  const nb = pos.board.slice();

  // Handle pawn promotion
  if (m.promotion) {
    const side = pos.turn;
    nb[m.to] = `${side}${m.promotion}` as Piece;
    nb[m.from] = EMPTY;
  } else {
    nb[m.to] = nb[m.from];
    nb[m.from] = EMPTY;
  }

  return {
    variant: pos.variant,
    board: nb,
    turn: pos.turn === 'w' ? 'b' : 'w',
    boardLength: pos.boardLength,
    boardWidth: pos.boardWidth,
  };
}

/**
 * Check if current side is in check
 */
export function isCheck(pos: Position): boolean {
  const config = getConfig(pos);
  const kIdx = findKing(pos.board, pos.turn, config);
  return attacked(pos.board, pos.turn, kIdx, config);
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

/**
 * Detect position repetition in history
 * Returns the count of how many times currentPos appears in history
 * Count >= 2 means twofold repetition (position repeated)
 */
export function detectRepetition(history: string[], currentPos: string): number {
  return history.filter(pos => pos === currentPos).length;
}

/**
 * Convert a move to standard algebraic notation
 * Examples: "e4", "Nf3", "Rxb5+", "O-O", "Qh4#"
 */
export function moveToAlgebraic(pos: Position, move: Move): string {
  const config = getConfig(pos);
  const piece = pos.board[move.from];
  const pieceType = typeOf(piece);
  const captured = pos.board[move.to] !== EMPTY;

  // Get destination square notation
  const [toRank, toFile] = indexToCoords(move.to, config);
  const toSquare = coordsToAlgebraic(toRank, toFile, config);

  // Check if move results in check or checkmate
  const newPos = applyMove(pos, move);
  const isCheck = newPos ? (legalMoves(newPos).length === 0 ? false : (findKing(newPos.board, newPos.turn, getConfig(newPos)) >= 0 ? attacked(newPos.board, newPos.turn, findKing(newPos.board, newPos.turn, getConfig(newPos)), getConfig(newPos)) : false)) : false;
  const isCheckmate = terminal(newPos) === `${newPos.turn === 'w' ? 'WHITE' : 'BLACK'}_MATE`;

  let notation = '';

  // Piece prefix (K, Q, R, B, N - nothing for pawns)
  if (pieceType && pieceType !== 'p') {
    notation += pieceType.toUpperCase();
  }

  // Disambiguation: check if multiple pieces of same type can reach the destination
  if (pieceType && pieceType !== 'p' && pieceType !== 'k') {
    const samePieceMoves = legalMoves(pos).filter(m => {
      const p = pos.board[m.from];
      return typeOf(p) === pieceType && sideOf(p) === pos.turn && m.to === move.to && m.from !== move.from;
    });

    if (samePieceMoves.length > 0) {
      const [fromRank, fromFile] = indexToCoords(move.from, config);
      // Check if file disambiguation is enough
      const sameFile = samePieceMoves.some(m => {
        const [, otherFile] = indexToCoords(m.from, config);
        return otherFile === fromFile;
      });

      if (!sameFile) {
        // File is enough
        notation += config.files[fromFile];
      } else {
        // Need rank or both
        const sameRank = samePieceMoves.some(m => {
          const [otherRank] = indexToCoords(m.from, config);
          return otherRank === fromRank;
        });

        if (!sameRank) {
          notation += (fromRank + 1).toString();
        } else {
          // Need both file and rank
          notation += coordsToAlgebraic(fromRank, fromFile, config);
        }
      }
    }
  }

  // Pawn captures need file notation
  if (pieceType === 'p' && captured) {
    const [, fromFile] = indexToCoords(move.from, config);
    notation += config.files[fromFile];
  }

  // Capture notation
  if (captured) {
    notation += 'x';
  }

  // Destination square
  notation += toSquare;

  // Promotion
  if (move.promotion) {
    notation += '=' + move.promotion.toUpperCase();
  }

  // Check/Checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
}
