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

import type { RuleSet } from './config/GameModeConfig';

// Re-export RuleSet for use by solver and other modules
export type { RuleSet };

export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p' | 'q';
export type Piece = `${Side}${PieceType}`;
export type Cell = Piece | '.';
export type Board = Cell[];

export type VariantType = '1xN' | 'NxM';

export interface BoardConfig {
  variant: VariantType;
  width: number;    // 1 for thin, 2 for skinny
  height: number;   // 12 for thin, 10 for skinny
  size: number;     // total squares
  files: string[];  // ['a'] or ['a','b']
  ranks: number[];  // [1..12] or [1..10]
}

export const CONFIGS: Record<VariantType, BoardConfig> = {
  '1xN': {
    variant: '1xN',
    width: 1,
    height: 12,
    size: 12,
    files: ['a'],
    ranks: Array.from({ length: 12 }, (_, i) => i + 1),
  },
  'NxM': {
    variant: 'NxM',
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
  if (pos.variant === '1xN' && pos.boardLength && pos.boardLength !== 12) {
    // Custom 1-D Chess mode with non-standard length
    return {
      variant: '1xN',
      width: 1,
      height: pos.boardLength,
      size: pos.boardLength,
      files: ['a'],
      ranks: Array.from({ length: pos.boardLength }, (_, i) => i + 1),
    };
  }
  if (pos.variant === 'NxM' && (pos.boardWidth || pos.boardLength)) {
    // Custom Thin Chess mode with non-standard dimensions (e.g., 3×8)
    const width = pos.boardWidth || 2;
    const height = pos.boardLength || 10;
    const files = Array.from({ length: width }, (_, i) => String.fromCharCode(97 + i)); // 'a','b','c'...
    return {
      variant: 'NxM',
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
  enPassantTarget?: number; // Square index behind the pawn that just double-stepped (or undefined)
  halfmoveClock?: number;   // Plies since last capture or pawn move (for fifty-move rule)
  castlingRights?: number;  // Bitmask: WK=1, WQ=2, BK=4, BQ=8
  positionHistory?: Map<string, number>; // Position hash -> count (for threefold repetition)
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
  '1xN': 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
  'NxM': 'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w',
};

// Backward compatibility: default starting position for Thin Chess
export const START_CODE = START_POSITIONS['1xN'];

/**
 * Default rule set (legacy behavior: no special rules)
 */
export const DEFAULT_RULES: RuleSet = {
  castling: false,
  enPassant: false,
  fiftyMoveRule: false,
  threefold: false,
  promotion: false,
};

/**
 * Castling rights bitmask constants
 */
export const CASTLING_WK = 1; // White kingside
export const CASTLING_WQ = 2; // White queenside
export const CASTLING_BK = 4; // Black kingside
export const CASTLING_BQ = 8; // Black queenside

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
  return config.files[file] + (config.height - rank);
}

/**
 * Position encoding/decoding
 * Format: "board:turn[:ep][:halfmove][:castling]"
 * Thin format:  "cell,cell,...,cell:side" (comma-separated, flat)
 * Skinny format: "c,c/c,c/.../c,c:side" (ranks separated by /, cells by comma)
 * cell = 'x' (empty) or '[wb][krnbp]' (piece)
 * side = 'w' or 'b'
 * ep = en passant target square index (optional, '-' for none)
 * halfmove = halfmove clock for fifty-move rule (optional, number)
 * castling = castling rights bitmask (optional, number)
 */
export function decode(code: string, variant: VariantType, boardLength?: number, boardWidth?: number): Position {
  const parts = code.trim().split(':');
  const cellsRaw = parts[0];
  const turnRaw = parts[1] || 'w';
  const epRaw = parts[2];
  const halfmoveRaw = parts[3];
  const castlingRaw = parts[4];

  // Parse cells first to determine actual board dimensions
  let items: string[];
  let detectedWidth: number | undefined;
  let detectedHeight: number | undefined;

  if (variant === '1xN') {
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
  if (variant === '1xN' && !boardLength) {
    boardLength = detectedHeight;
  }
  if (variant === 'NxM') {
    if (!boardWidth) boardWidth = detectedWidth;
    if (!boardLength) boardLength = detectedHeight;
  }

  // Build position object with detected/provided dimensions
  const pos: Position = {
    variant,
    board: [], // Will be filled below
    turn: (turnRaw || 'w').trim() === 'b' ? 'b' : 'w',
  };

  if (variant === '1xN' && boardLength) {
    pos.boardLength = boardLength;
  }
  if (variant === 'NxM') {
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

  // Parse optional fields (with proper defaults)
  if (epRaw && epRaw !== '-') {
    const epIndex = parseInt(epRaw, 10);
    if (!isNaN(epIndex)) {
      pos.enPassantTarget = epIndex;
    }
  } else {
    pos.enPassantTarget = undefined;
  }

  if (halfmoveRaw) {
    const halfmove = parseInt(halfmoveRaw, 10);
    if (!isNaN(halfmove)) {
      pos.halfmoveClock = halfmove;
    }
  } else {
    pos.halfmoveClock = 0; // Default to 0 if not specified
  }

  if (castlingRaw) {
    const castling = parseInt(castlingRaw, 10);
    if (!isNaN(castling)) {
      pos.castlingRights = castling;
    }
  } else {
    pos.castlingRights = 0; // Default to no castling rights
  }

  // Note: positionHistory is intentionally NOT initialized here
  // It will be created by applyMove() when needed for threefold detection
  // This prevents wiping history when decoding positions from game history

  return pos;
}

export function encode(pos: Position, includeExtendedFields = false): string {
  const config = getConfig(pos);
  const cells = pos.board.map(p => p === EMPTY ? 'x' : p);

  let cellsStr: string;
  if (pos.variant === '1xN') {
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

  let result = `${cellsStr}:${pos.turn}`;

  // Add extended fields if requested or if they have non-default values
  if (includeExtendedFields ||
      pos.enPassantTarget !== undefined ||
      (pos.halfmoveClock !== undefined && pos.halfmoveClock > 0) ||
      (pos.castlingRights !== undefined && pos.castlingRights > 0)) {

    const ep = pos.enPassantTarget !== undefined ? String(pos.enPassantTarget) : '-';
    const halfmove = pos.halfmoveClock !== undefined ? String(pos.halfmoveClock) : '0';
    const castling = pos.castlingRights !== undefined ? String(pos.castlingRights) : '0';

    result += `:${ep}:${halfmove}:${castling}`;
  }

  return result;
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
  // Guard against invalid indices (e.g., if findKing() fails and returns -1)
  if (idx < 0 || idx >= config.size) return false;

  const opp: Side = side === 'w' ? 'b' : 'w';
  const [rank, file] = indexToCoords(idx, config);

  if (config.variant === '1xN') {
    // Thin Chess: 1D attacks
    // Opponent king ±1
    for (const d of [-1, 1]) {
      const j = idx + d;
      if (inBounds(j, config) && board[j] === `${opp}k`) return true;
    }

    // Opponent knight: ±2 in 1D
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
export function legalMoves(pos: Position, rules: RuleSet = DEFAULT_RULES): Move[] {
  const { board, turn, variant } = pos;
  const config = getConfig(pos);
  const moves: Move[] = [];

  for (let i = 0; i < config.size; i++) {
    const p = board[i];
    if (p === EMPTY) continue;
    if (sideOf(p) !== turn) continue;

    const t = typeOf(p);
    let pieceMoves: Move[] = [];

    if (variant === '1xN') {
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
        // Knight in 1D: always jumps ±2 (knightModel only applies to NxM)
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

        // Castling (if enabled)
        // NOTE: Castling is disabled in all current modes (castling=false in game-modes.json)
        // This scaffolding is provided for future use
        if (rules.castling && pos.castlingRights) {
          // TODO: Implement castling move generation
          // Requirements:
          // - King and rook must not have moved (check castlingRights bitmask)
          // - No pieces between king and rook
          // - King is not in check
          // - King does not pass through check
          // - King does not land in check
          // Kingside: king moves 2 squares toward h-file, rook jumps to square king passed
          // Queenside: king moves 2 squares toward a-file, rook jumps to square king passed
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
            if (oneStep === promotionRank && rules.promotion) {
              // Promotion enabled: generate all four promotion options
              for (const promo of ['q', 'r', 'b', 'n'] as PieceType[]) {
                pieceMoves.push({ from: i, to: j, promotion: promo });
              }
            } else {
              // No promotion or not on promotion rank
              pieceMoves.push({ from: i, to: j });
            }

            // Double move from starting position (only if not on promotion rank)
            if (rank === startRank && oneStep !== promotionRank) {
              const twoStep = rank + 2 * direction;
              if (inBounds2D(twoStep, file, config)) {
                const j2 = coordsToIndex(twoStep, file, config);
                if (board[j2] === EMPTY) {
                  pieceMoves.push({ from: i, to: j2 });
                }
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
            if (newRank === promotionRank && rules.promotion) {
              // Promotion enabled: generate all four promotion options
              for (const promo of ['q', 'r', 'b', 'n'] as PieceType[]) {
                pieceMoves.push({ from: i, to: j, promotion: promo });
              }
            } else {
              pieceMoves.push({ from: i, to: j });
            }
          }
        }

        // En passant captures
        if (rules.enPassant && pos.enPassantTarget !== undefined) {
          const epTarget = pos.enPassantTarget;
          const [epRank, epFile] = indexToCoords(epTarget, config);

          // Check if we're on the correct rank and adjacent file
          if (rank === epRank && Math.abs(file - epFile) === 1) {
            // The capture square is one rank forward
            const captureRank = rank + direction;
            const captureSquare = coordsToIndex(captureRank, epFile, config);
            pieceMoves.push({ from: i, to: captureSquare });
          }
        }
      }
    }

    // Filter out moves that would leave king in check
    for (const m of pieceMoves) {
      if (!wouldExposeKing(m, board, turn, config, rules, pos)) {
        moves.push(m);
      }
    }
  }

  return moves;
}

function wouldExposeKing(m: Move, board: Board, turn: Side, config: BoardConfig, rules: RuleSet, pos: Position): boolean {
  const nb = board.slice();
  const isPawnMove = typeOf(board[m.from]) === 'p';
  const isCapture = board[m.to] !== EMPTY;

  // Handle en passant capture (remove the captured pawn)
  if (rules.enPassant && pos.enPassantTarget !== undefined && isPawnMove && !isCapture && m.to === pos.enPassantTarget) {
    const direction = turn === 'w' ? -1 : 1;
    const [epRank, epFile] = indexToCoords(pos.enPassantTarget, config);
    const capturedPawnRank = epRank - direction;
    const capturedPawnSquare = coordsToIndex(capturedPawnRank, epFile, config);
    nb[capturedPawnSquare] = EMPTY;
  }

  nb[m.to] = nb[m.from];
  nb[m.from] = EMPTY;
  const kIdx = findKing(nb, turn, config);
  return attacked(nb, turn, kIdx, config);
}

/**
 * Apply a move and return new position
 */
export function applyMove(pos: Position, m: Move, rules: RuleSet = DEFAULT_RULES): Position {
  const config = getConfig(pos);
  const nb = pos.board.slice();
  const movingPiece = nb[m.from];
  const capturedPiece = nb[m.to];

  // Detect if this is a pawn move or capture
  const isPawnMove = typeOf(movingPiece) === 'p';
  const isCapture = capturedPiece !== EMPTY;

  // Handle en passant capture (remove the captured pawn from EP target square)
  let epCaptured = false;
  if (rules.enPassant && pos.enPassantTarget !== undefined && isPawnMove && !isCapture) {
    const direction = pos.turn === 'w' ? -1 : 1;
    const [, toFile] = indexToCoords(m.to, config);
    const [epRank, epFile] = indexToCoords(pos.enPassantTarget, config);

    // EP capture: moving pawn lands on the EP target square (diagonally)
    // The captured pawn is one square in the opposite direction from EP target
    const capturedPawnRank = epRank - direction;
    const capturedPawnSquare = coordsToIndex(capturedPawnRank, epFile, config);

    if (m.to === pos.enPassantTarget && Math.abs(toFile - epFile) === 1) {
      nb[capturedPawnSquare] = EMPTY;
      epCaptured = true;
    }
  }

  // Handle pawn promotion
  if (m.promotion) {
    const side = pos.turn;
    nb[m.to] = `${side}${m.promotion}` as Piece;
    nb[m.from] = EMPTY;
  } else {
    nb[m.to] = nb[m.from];
    nb[m.from] = EMPTY;
  }

  // Calculate new en passant target
  let newEPTarget: number | undefined = undefined;
  if (rules.enPassant && isPawnMove && !m.promotion) {
    const [fromRank] = indexToCoords(m.from, config);
    const [toRank, toFile] = indexToCoords(m.to, config);

    // Check if this was a double-step
    if (Math.abs(toRank - fromRank) === 2) {
      // EP target is the square the pawn jumped over
      const middleRank = (fromRank + toRank) / 2;
      newEPTarget = coordsToIndex(middleRank, toFile, config);
    }
  }

  // Update halfmove clock
  let newHalfmoveClock = (pos.halfmoveClock || 0) + 1;
  if (rules.fiftyMoveRule) {
    if (isPawnMove || isCapture || epCaptured) {
      newHalfmoveClock = 0;
    }
  } else {
    newHalfmoveClock = 0; // Don't track if rule is disabled
  }

  // Update castling rights
  let newCastlingRights = pos.castlingRights || 0;
  if (rules.castling && newCastlingRights > 0) {
    const pieceType = typeOf(movingPiece);

    // King moves remove both castling rights for that side
    if (pieceType === 'k') {
      if (pos.turn === 'w') {
        newCastlingRights &= ~(CASTLING_WK | CASTLING_WQ);
      } else {
        newCastlingRights &= ~(CASTLING_BK | CASTLING_BQ);
      }
    }

    // Rook moves/captures remove castling rights
    // Note: Proper implementation requires knowing initial rook squares (e.g., a1, h1 for white)
    // For now, any rook move clears all rights for that side
    // TODO: Track rook starting squares to clear only the specific castling right
    if (pieceType === 'r') {
      if (pos.turn === 'w') {
        newCastlingRights &= ~(CASTLING_WK | CASTLING_WQ);
      } else {
        newCastlingRights &= ~(CASTLING_BK | CASTLING_BQ);
      }
    }

    // If a rook is captured, remove castling rights for that rook
    // TODO: This also needs to know which corner the rook was in
    if (isCapture && typeOf(capturedPiece) === 'r') {
      const capturedSide = sideOf(capturedPiece);
      if (capturedSide === 'w') {
        newCastlingRights &= ~(CASTLING_WK | CASTLING_WQ);
      } else if (capturedSide === 'b') {
        newCastlingRights &= ~(CASTLING_BK | CASTLING_BQ);
      }
    }
  }

  // Update position history for threefold repetition
  const newHistory = rules.threefold ? new Map(pos.positionHistory || new Map()) : undefined;

  const newPos: Position = {
    variant: pos.variant,
    board: nb,
    turn: pos.turn === 'w' ? 'b' : 'w',
    boardLength: pos.boardLength,
    boardWidth: pos.boardWidth,
    enPassantTarget: newEPTarget,
    halfmoveClock: newHalfmoveClock,
    castlingRights: newCastlingRights,
    positionHistory: newHistory,
  };

  // Add current position to history after the move
  if (newHistory) {
    const hash = positionHash(newPos);
    const count = newHistory.get(hash) || 0;
    newHistory.set(hash, count + 1);
  }

  return newPos;
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
 * Check if fifty-move rule draw condition is met
 */
export function isFiftyMoveDraw(pos: Position, rules: RuleSet = DEFAULT_RULES): boolean {
  if (!rules.fiftyMoveRule) return false;
  return (pos.halfmoveClock || 0) >= 100;
}

/**
 * Check if threefold repetition draw condition is met
 */
export function isThreefoldDraw(pos: Position, rules: RuleSet = DEFAULT_RULES): boolean {
  if (!rules.threefold || !pos.positionHistory) return false;
  const currentHash = positionHash(pos);
  const count = pos.positionHistory.get(currentHash) || 0;
  return count >= 3;
}

/**
 * Generate position hash for repetition detection
 * Includes: board state, turn, EP target, castling rights
 */
export function positionHash(pos: Position): string {
  const parts: string[] = [
    pos.board.join(','),
    pos.turn,
    String(pos.enPassantTarget ?? 'none'),
    String(pos.castlingRights ?? 0),
  ];
  return parts.join('|');
}

/**
 * Terminal state detection
 * Returns: null (non-terminal) | 'STALEMATE' | 'WHITE_MATE' | 'BLACK_MATE' | 'DRAW_FIFTY' | 'DRAW_THREEFOLD'
 *          | 'WHITE_RACE_WIN' | 'BLACK_RACE_WIN' | 'WHITE_MATERIAL_WIN' | 'BLACK_MATERIAL_WIN' | 'DRAW_MATERIAL_TIE'
 */
export function terminal(pos: Position, rules: RuleSet = DEFAULT_RULES): string | null {
  const config = getConfig(pos);

  // Race to back rank check (before no-moves check - triggers on any move)
  if (rules.raceToBackRank) {
    // Check if ANY white piece reached top rank (rank 0)
    for (let i = 0; i < config.width; i++) {
      const square = coordsToIndex(0, i, config);
      const piece = pos.board[square];
      if (piece !== EMPTY && sideOf(piece) === 'w') {
        return 'WHITE_RACE_WIN';
      }
    }

    // Check if ANY black piece reached bottom rank (height - 1)
    const bottomRank = config.height - 1;
    for (let i = 0; i < config.width; i++) {
      const square = coordsToIndex(bottomRank, i, config);
      const piece = pos.board[square];
      if (piece !== EMPTY && sideOf(piece) === 'b') {
        return 'BLACK_RACE_WIN';
      }
    }
  }

  // Check for draw by fifty-move rule
  if (isFiftyMoveDraw(pos, rules)) {
    return 'DRAW_FIFTY';
  }

  // Check for draw by threefold repetition
  if (isThreefoldDraw(pos, rules)) {
    return 'DRAW_THREEFOLD';
  }

  const moves = legalMoves(pos, rules);
  if (moves.length > 0) return null; // non-terminal

  // No legal moves
  if (isCheck(pos)) {
    return pos.turn === 'w' ? 'WHITE_MATE' : 'BLACK_MATE';
  }

  // Material count win (replaces stalemate when enabled)
  if (rules.materialCountWin) {
    // Count pieces for each side (excluding empty squares)
    const whitePieces = pos.board.filter(p => p !== EMPTY && sideOf(p) === 'w').length;
    const blackPieces = pos.board.filter(p => p !== EMPTY && sideOf(p) === 'b').length;

    if (whitePieces > blackPieces) return 'WHITE_MATERIAL_WIN';
    if (blackPieces > whitePieces) return 'BLACK_MATERIAL_WIN';
    return 'DRAW_MATERIAL_TIE';  // Equal material = still draw
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
