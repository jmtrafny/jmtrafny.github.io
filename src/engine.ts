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
 * Configuration cache to avoid recreating config objects
 * Key format: "variant-boardLength-boardWidth"
 */
const configCache = new Map<string, BoardConfig>();

/**
 * Clear the configuration cache
 * Useful for testing or when memory needs to be reclaimed
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Get board configuration for a position.
 * Handles variable board dimensions for both variants.
 * Results are cached to avoid repeated object creation.
 */
export function getConfig(pos: Position): BoardConfig {
  // Build cache key from position properties
  const variant = pos.variant;
  const length = pos.boardLength || (variant === '1xN' ? 12 : 10);
  const width = pos.boardWidth || (variant === '1xN' ? 1 : 2);
  const cacheKey = `${variant}-${length}-${width}`;

  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  // Generate config (existing logic)
  let config: BoardConfig;

  if (variant === '1xN' && pos.boardLength && pos.boardLength !== 12) {
    // Custom 1-D Chess mode with non-standard length
    config = {
      variant: '1xN',
      width: 1,
      height: pos.boardLength,
      size: pos.boardLength,
      files: ['a'],
      ranks: Array.from({ length: pos.boardLength }, (_, i) => i + 1),
    };
  } else if (variant === 'NxM' && (pos.boardWidth || pos.boardLength)) {
    // Custom Thin Chess mode with non-standard dimensions (e.g., 3×8)
    const width = pos.boardWidth || 2;
    const height = pos.boardLength || 10;
    const files = Array.from({ length: width }, (_, i) => String.fromCharCode(97 + i)); // 'a','b','c'...
    config = {
      variant: 'NxM',
      width,
      height,
      size: width * height,
      files,
      ranks: Array.from({ length: height }, (_, i) => i + 1),
    };
  } else {
    // Standard configuration
    config = CONFIGS[variant];
  }

  // Cache and return
  configCache.set(cacheKey, config);
  return config;
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
  movedPawns?: bigint;      // Bitmask: bit N set if pawn at square N has moved (uses BigInt for 64+ square boards)
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
  pawnTwoMove: true,  // Default: allow double-moves on first pawn move
};

/**
 * Castling rights bitmask constants
 */
export const CASTLING_WK = 1; // White kingside
export const CASTLING_WQ = 2; // White queenside
export const CASTLING_BK = 4; // Black kingside
export const CASTLING_BQ = 8; // Black queenside

/**
 * Get rook starting squares for castling
 * Returns: { whiteKingside, whiteQueenside, blackKingside, blackQueenside }
 * Returns null if board is too small for castling (width < 5)
 */
export function getRookSquares(config: BoardConfig): {
  whiteKingside: number;
  whiteQueenside: number;
  blackKingside: number;
  blackQueenside: number;
} | null {
  // Castling only makes sense on boards with width >= 5
  // Need at least: a-file (queenside rook), c-file, king file, f-file, h-file (kingside rook)
  if (config.width < 5) return null;

  const lastRank = config.height - 1;
  const lastFile = config.width - 1;

  return {
    whiteKingside: coordsToIndex(lastRank, lastFile, config),      // h1 equivalent
    whiteQueenside: coordsToIndex(lastRank, 0, config),            // a1 equivalent
    blackKingside: coordsToIndex(0, lastFile, config),             // h8 equivalent
    blackQueenside: coordsToIndex(0, 0, config),                   // a8 equivalent
  };
}

/**
 * Get initial castling rights based on current board position
 * Checks if kings and rooks are on their starting squares
 */
export function getInitialCastlingRights(pos: Position): number {
  const config = getConfig(pos);
  const rookSquares = getRookSquares(config);

  if (!rookSquares) return 0; // Board too small for castling

  let rights = 0;
  const lastRank = config.height - 1;
  const kingFile = Math.floor(config.width / 2); // Middle file for king

  const whiteKingSquare = coordsToIndex(lastRank, kingFile, config);
  const blackKingSquare = coordsToIndex(0, kingFile, config);

  // White kingside castling
  if (pos.board[whiteKingSquare] === 'wk' && pos.board[rookSquares.whiteKingside] === 'wr') {
    rights |= CASTLING_WK;
  }

  // White queenside castling
  if (pos.board[whiteKingSquare] === 'wk' && pos.board[rookSquares.whiteQueenside] === 'wr') {
    rights |= CASTLING_WQ;
  }

  // Black kingside castling
  if (pos.board[blackKingSquare] === 'bk' && pos.board[rookSquares.blackKingside] === 'br') {
    rights |= CASTLING_BK;
  }

  // Black queenside castling
  if (pos.board[blackKingSquare] === 'bk' && pos.board[rookSquares.blackQueenside] === 'br') {
    rights |= CASTLING_BQ;
  }

  return rights;
}

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
 * Format: "board:turn[:ep][:halfmove][:castling][:movedPawns]"
 * Thin format:  "cell,cell,...,cell:side" (comma-separated, flat)
 * Skinny format: "c,c/c,c/.../c,c:side" (ranks separated by /, cells by comma)
 * cell = 'x' (empty) or '[wb][krnbp]' (piece)
 * side = 'w' or 'b'
 * ep = en passant target square index (optional, '-' for none)
 * halfmove = halfmove clock for fifty-move rule (optional, number)
 * castling = castling rights bitmask (optional, number)
 * movedPawns = moved pawns bitmask as hex string (optional, '-' for none)
 */
export function decode(code: string, variant: VariantType, boardLength?: number, boardWidth?: number, rules?: RuleSet): Position {
  const parts = code.trim().split(':');
  const cellsRaw = parts[0];
  const turnRaw = parts[1] || 'w';
  const epRaw = parts[2];
  const halfmoveRaw = parts[3];
  const castlingRaw = parts[4];
  const movedPawnsRaw = parts[5];

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

  // Validate king existence (both sides must have exactly one king)
  const whiteKingCount = pos.board.filter(p => p === 'wk').length;
  const blackKingCount = pos.board.filter(p => p === 'bk').length;

  if (whiteKingCount === 0) {
    throw new Error('Invalid position: White king not found');
  }
  if (blackKingCount === 0) {
    throw new Error('Invalid position: Black king not found');
  }
  if (whiteKingCount > 1) {
    throw new Error(`Invalid position: Multiple white kings found (${whiteKingCount})`);
  }
  if (blackKingCount > 1) {
    throw new Error(`Invalid position: Multiple black kings found (${blackKingCount})`);
  }

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
    // Auto-detect castling rights if castling rule is enabled and no explicit rights specified
    if (rules?.castling && variant === 'NxM') {
      pos.castlingRights = getInitialCastlingRights(pos);
    } else {
      pos.castlingRights = 0; // Default to no castling rights
    }
  }

  if (movedPawnsRaw && movedPawnsRaw !== '-') {
    try {
      // Parse hex string back to BigInt
      pos.movedPawns = BigInt('0x' + movedPawnsRaw);
    } catch {
      // Invalid hex, default to no pawns moved
      pos.movedPawns = 0n;
    }
  } else {
    pos.movedPawns = 0n; // Default to no pawns moved
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
      (pos.castlingRights !== undefined && pos.castlingRights > 0) ||
      (pos.movedPawns !== undefined && pos.movedPawns !== 0n)) {

    const ep = pos.enPassantTarget !== undefined ? String(pos.enPassantTarget) : '-';
    const halfmove = pos.halfmoveClock !== undefined ? String(pos.halfmoveClock) : '0';
    const castling = pos.castlingRights !== undefined ? String(pos.castlingRights) : '0';
    const movedPawns = pos.movedPawns !== undefined && pos.movedPawns !== 0n
      ? pos.movedPawns.toString(16) // Hex for compactness
      : '-';

    result += `:${ep}:${halfmove}:${castling}:${movedPawns}`;
  }

  return result;
}

/**
 * Helper functions
 */
export function inBounds(i: number, config: BoardConfig): boolean {
  return i >= 0 && i < config.size;
}

export function pieceSide(piece: Cell): Side | null {
  if (!piece || piece === EMPTY) return null;
  return piece[0] as Side;
}

export function pieceType(piece: Cell): PieceType | null {
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
    if (pieceSide(p) !== turn) continue;

    const t = pieceType(p);
    let pieceMoves: Move[] = [];

    if (variant === '1xN') {
      // Thin Chess: 1D movement
      if (t === 'k') {
        // King moves ±1
        for (const d of [-1, 1]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && pieceSide(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'n') {
        // Knight in 1D: always jumps ±2 (knightModel only applies to NxM)
        for (const d of [-2, 2]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && pieceSide(q) === turn) continue;
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
              if (pieceSide(q) !== turn) {
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
          if (q !== EMPTY && pieceSide(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }

        // Castling (if enabled)
        if (rules.castling && pos.castlingRights) {
          const rookSquares = getRookSquares(config);

          if (rookSquares) {
            const kingFile = Math.floor(config.width / 2); // Middle file
            const isWhite = turn === 'w';
            const homeRank = isWhite ? config.height - 1 : 0;

            // Only attempt castling if king is on home rank at center file
            if (rank === homeRank && file === kingFile) {
              // King must not be in check to castle
              if (!isCheck(pos)) {

                // Kingside castling
                const kingsideRight = isWhite ? CASTLING_WK : CASTLING_BK;
                if (pos.castlingRights & kingsideRight) {
                  const rookSquare = isWhite ? rookSquares.whiteKingside : rookSquares.blackKingside;
                  const rookFile = config.width - 1;

                  // Check if rook is still on starting square
                  if (board[rookSquare] === `${turn}r`) {
                    // Check if squares between king and rook are empty
                    let pathClear = true;
                    for (let f = kingFile + 1; f < rookFile; f++) {
                      if (board[coordsToIndex(homeRank, f, config)] !== EMPTY) {
                        pathClear = false;
                        break;
                      }
                    }

                    if (pathClear) {
                      // Check if king passes through or lands in check
                      // King moves from kingFile to kingFile+2
                      const passThroughSquare = coordsToIndex(homeRank, kingFile + 1, config);
                      const landingSquare = coordsToIndex(homeRank, kingFile + 2, config);

                      // Simulate king on pass-through square
                      const testBoard1 = board.slice();
                      testBoard1[i] = EMPTY;
                      testBoard1[passThroughSquare] = `${turn}k`;

                      // Simulate king on landing square
                      const testBoard2 = board.slice();
                      testBoard2[i] = EMPTY;
                      testBoard2[landingSquare] = `${turn}k`;

                      if (!attacked(testBoard1, turn, passThroughSquare, config) &&
                          !attacked(testBoard2, turn, landingSquare, config)) {
                        // Castling is legal! King moves 2 squares toward rook
                        pieceMoves.push({ from: i, to: landingSquare });
                      }
                    }
                  }
                }

                // Queenside castling
                const queensideRight = isWhite ? CASTLING_WQ : CASTLING_BQ;
                if (pos.castlingRights & queensideRight) {
                  const rookSquare = isWhite ? rookSquares.whiteQueenside : rookSquares.blackQueenside;
                  const rookFile = 0;

                  // Check if rook is still on starting square
                  if (board[rookSquare] === `${turn}r`) {
                    // Check if squares between king and rook are empty
                    let pathClear = true;
                    for (let f = rookFile + 1; f < kingFile; f++) {
                      if (board[coordsToIndex(homeRank, f, config)] !== EMPTY) {
                        pathClear = false;
                        break;
                      }
                    }

                    if (pathClear) {
                      // Check if king passes through or lands in check
                      // King moves from kingFile to kingFile-2
                      const passThroughSquare = coordsToIndex(homeRank, kingFile - 1, config);
                      const landingSquare = coordsToIndex(homeRank, kingFile - 2, config);

                      // Simulate king on pass-through square
                      const testBoard1 = board.slice();
                      testBoard1[i] = EMPTY;
                      testBoard1[passThroughSquare] = `${turn}k`;

                      // Simulate king on landing square
                      const testBoard2 = board.slice();
                      testBoard2[i] = EMPTY;
                      testBoard2[landingSquare] = `${turn}k`;

                      if (!attacked(testBoard1, turn, passThroughSquare, config) &&
                          !attacked(testBoard2, turn, landingSquare, config)) {
                        // Castling is legal! King moves 2 squares toward queenside
                        pieceMoves.push({ from: i, to: landingSquare });
                      }
                    }
                  }
                }
              }
            }
          }
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
          if (q !== EMPTY && pieceSide(q) === turn) continue;
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
              if (pieceSide(q) !== turn) {
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
              if (pieceSide(q) !== turn) {
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
              if (pieceSide(q) !== turn) {
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

            // Double move from starting position (only if pawnTwoMove rule enabled and pawn hasn't moved)
            // Check: pawnTwoMove enabled AND pawn is on starting rank AND hasn't moved yet (bit not set in movedPawns)
            // Edge case: On very small boards (e.g., 2×4), ensure double-move doesn't overshoot board
            const pawnTwoMoveEnabled = rules.pawnTwoMove !== false; // Default to true if undefined
            const hasMoved = pos.movedPawns ? (pos.movedPawns & (1n << BigInt(i))) !== 0n : false;
            if (pawnTwoMoveEnabled && rank === startRank && !hasMoved && oneStep !== promotionRank) {
              const twoStep = rank + 2 * direction;
              // Validate that double-move doesn't go past promotion rank or out of bounds
              const wouldOvershoot = (turn === 'w' && twoStep <= promotionRank) || (turn === 'b' && twoStep >= promotionRank);
              if (!wouldOvershoot && inBounds2D(twoStep, file, config)) {
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
          if (q !== EMPTY && pieceSide(q) !== turn) {
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

/**
 * Check if a move would leave the king in check (and thus be illegal)
 *
 * @param m - The move to test
 * @param board - The current board state
 * @param turn - The side making the move
 * @param config - Board configuration
 * @param rules - Rule set for the game
 * @param pos - Full position (needed for en passant)
 * @returns true if the move would expose the king to check
 */
function wouldExposeKing(m: Move, board: Board, turn: Side, config: BoardConfig, rules: RuleSet, pos: Position): boolean {
  const nb = board.slice();
  const isPawnMove = pieceType(board[m.from]) === 'p';
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

  // Defensive check: if king not found, position is invalid
  if (kIdx < 0) {
    throw new Error(`Invalid position: ${turn} king not found on board`);
  }

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
  const isPawnMove = pieceType(movingPiece) === 'p';
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

  // Detect castling move (king moves 2 squares horizontally)
  const isKingMove = pieceType(movingPiece) === 'k';
  let isCastling = false;

  if (isKingMove && pos.variant === 'NxM') {
    const [fromRank, fromFile] = indexToCoords(m.from, config);
    const [toRank, toFile] = indexToCoords(m.to, config);

    // Castling: king moves 2 squares on the same rank
    if (fromRank === toRank && Math.abs(toFile - fromFile) === 2) {
      isCastling = true;

      // Determine if kingside or queenside
      const isKingside = toFile > fromFile;
      const rookSquares = getRookSquares(config);

      if (rookSquares) {
        const isWhite = pos.turn === 'w';
        const rookFromSquare = isKingside
          ? (isWhite ? rookSquares.whiteKingside : rookSquares.blackKingside)
          : (isWhite ? rookSquares.whiteQueenside : rookSquares.blackQueenside);

        // Calculate rook destination (square the king passed over)
        const rookToFile = isKingside ? toFile - 1 : toFile + 1;
        const rookToSquare = coordsToIndex(toRank, rookToFile, config);

        // Move king
        nb[m.to] = nb[m.from];
        nb[m.from] = EMPTY;

        // Move rook
        nb[rookToSquare] = nb[rookFromSquare];
        nb[rookFromSquare] = EMPTY;
      }
    }
  }

  // Handle pawn promotion
  if (!isCastling) {
    if (m.promotion) {
      const side = pos.turn;
      nb[m.to] = `${side}${m.promotion}` as Piece;
      nb[m.from] = EMPTY;
    } else {
      nb[m.to] = nb[m.from];
      nb[m.from] = EMPTY;
    }
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
    const movingPieceType = pieceType(movingPiece);
    const rookSquares = getRookSquares(config);

    // King moves remove both castling rights for that side
    if (movingPieceType === 'k') {
      if (pos.turn === 'w') {
        newCastlingRights &= ~(CASTLING_WK | CASTLING_WQ);
      } else {
        newCastlingRights &= ~(CASTLING_BK | CASTLING_BQ);
      }
    }

    // Rook moves remove castling rights for that specific rook
    if (movingPieceType === 'r' && rookSquares) {
      if (pos.turn === 'w') {
        if (m.from === rookSquares.whiteKingside) {
          newCastlingRights &= ~CASTLING_WK;
        } else if (m.from === rookSquares.whiteQueenside) {
          newCastlingRights &= ~CASTLING_WQ;
        }
      } else {
        if (m.from === rookSquares.blackKingside) {
          newCastlingRights &= ~CASTLING_BK;
        } else if (m.from === rookSquares.blackQueenside) {
          newCastlingRights &= ~CASTLING_BQ;
        }
      }
    }

    // If a rook is captured, remove castling rights for that specific rook
    if (isCapture && pieceType(capturedPiece) === 'r' && rookSquares) {
      const capturedSide = pieceSide(capturedPiece);
      if (capturedSide === 'w') {
        if (m.to === rookSquares.whiteKingside) {
          newCastlingRights &= ~CASTLING_WK;
        } else if (m.to === rookSquares.whiteQueenside) {
          newCastlingRights &= ~CASTLING_WQ;
        }
      } else if (capturedSide === 'b') {
        if (m.to === rookSquares.blackKingside) {
          newCastlingRights &= ~CASTLING_BK;
        } else if (m.to === rookSquares.blackQueenside) {
          newCastlingRights &= ~CASTLING_BQ;
        }
      }
    }
  }

  // Update position history for threefold repetition
  const newHistory = rules.threefold ? new Map(pos.positionHistory || new Map()) : undefined;

  // Track pawn movements
  let newMovedPawns = pos.movedPawns || 0n;
  if (isPawnMove) {
    // Set the bit for the square the pawn moved FROM
    // (After the move, the pawn is no longer there, so we track its origin)
    newMovedPawns |= (1n << BigInt(m.from));
    // Also set the bit for where it moved TO
    // (This ensures if the pawn moves again, we know it has moved)
    newMovedPawns |= (1n << BigInt(m.to));
  }

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
    movedPawns: newMovedPawns,
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
      if (piece !== EMPTY && pieceSide(piece) === 'w') {
        return 'WHITE_RACE_WIN';
      }
    }

    // Check if ANY black piece reached bottom rank (height - 1)
    const bottomRank = config.height - 1;
    for (let i = 0; i < config.width; i++) {
      const square = coordsToIndex(bottomRank, i, config);
      const piece = pos.board[square];
      if (piece !== EMPTY && pieceSide(piece) === 'b') {
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
    const whitePieces = pos.board.filter(p => p !== EMPTY && pieceSide(p) === 'w').length;
    const blackPieces = pos.board.filter(p => p !== EMPTY && pieceSide(p) === 'b').length;

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
export function moveToAlgebraic(pos: Position, move: Move, rules: RuleSet = DEFAULT_RULES): string {
  const config = getConfig(pos);
  const piece = pos.board[move.from];
  const type = pieceType(piece);
  const captured = pos.board[move.to] !== EMPTY;

  // Detect castling (king moves 2 squares horizontally)
  if (type === 'k' && pos.variant === 'NxM') {
    const [fromRank, fromFile] = indexToCoords(move.from, config);
    const [toRank, toFile] = indexToCoords(move.to, config);

    if (fromRank === toRank && Math.abs(toFile - fromFile) === 2) {
      // Castling move
      const isKingside = toFile > fromFile;

      // Check if move results in check or checkmate
      const newPos = applyMove(pos, move, rules);
      const isInCheck = isCheck(newPos);
      const isCheckmate = terminal(newPos, rules) === `${newPos.turn === 'w' ? 'WHITE' : 'BLACK'}_MATE`;

      let notation = isKingside ? 'O-O' : 'O-O-O';

      if (isCheckmate) {
        notation += '#';
      } else if (isInCheck) {
        notation += '+';
      }

      return notation;
    }
  }

  // Get destination square notation
  const [toRank, toFile] = indexToCoords(move.to, config);
  const toSquare = coordsToAlgebraic(toRank, toFile, config);

  // Check if move results in check or checkmate
  const newPos = applyMove(pos, move, rules);
  const isInCheck = isCheck(newPos);
  const isCheckmate = terminal(newPos, rules) === `${newPos.turn === 'w' ? 'WHITE' : 'BLACK'}_MATE`;

  let notation = '';

  // Piece prefix (K, Q, R, B, N - nothing for pawns)
  if (type && type !== 'p') {
    notation += type.toUpperCase();
  }

  // Disambiguation: check if multiple pieces of same type can reach the destination
  if (type && type !== 'p' && type !== 'k') {
    const samePieceMoves = legalMoves(pos, rules).filter(m => {
      const p = pos.board[m.from];
      return pieceType(p) === type && pieceSide(p) === pos.turn && m.to === move.to && m.from !== move.from;
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
  if (type === 'p' && captured) {
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
  } else if (isInCheck) {
    notation += '+';
  }

  return notation;
}
