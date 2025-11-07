/**
 * Solver Configuration Constants
 *
 * Centralized configuration for solver tier thresholds, budgets,
 * and evaluation parameters. Extracted from solver.ts and evaluator.ts
 * to improve maintainability and make tuning easier.
 */

/**
 * Complexity thresholds for solver tier selection
 *
 * Complexity = pieceCount × sqrt(boardSize / 12)
 * This scales solver selection based on both piece count and board size.
 */
export const SOLVER_TIER_THRESHOLDS = {
  /** Maximum complexity for Tier 1 (perfect solver) */
  TIER1_MAX_COMPLEXITY: 6,

  /** Maximum complexity for Tier 2 (bounded iterative deepening) */
  TIER2_MAX_COMPLEXITY: 12,

  /** Maximum number of legal moves for Tier 2 */
  TIER2_MAX_MOVES: 30,
} as const;

/**
 * Node and memory budgets for solver tiers
 *
 * These limits prevent browser freezing and memory exhaustion
 * during complex position analysis.
 */
export const SOLVER_BUDGETS = {
  /** Tier 1: Maximum nodes to search before bailing out */
  TIER1_MAX_NODES: 10_000,

  /** Tier 1: Maximum transposition table entries */
  TIER1_MAX_TT_SIZE: 50_000,

  /** Tier 2: Maximum nodes per iteration */
  TIER2_MAX_NODES: 50_000,

  /** Tier 2: Maximum transposition table entries */
  TIER2_MAX_TT_SIZE: 100_000,

  /** Tier 2: Maximum time in milliseconds before timeout */
  TIER2_MAX_TIME_MS: 2000,

  /** Tier 2: Maximum iterative deepening depth */
  TIER2_MAX_DEPTH: 20,
} as const;

/**
 * Search depth limits
 */
export const SEARCH_LIMITS = {
  /** Maximum recursion depth to prevent stack overflow */
  MAX_DEPTH: 30,

  /** Tier 3 search depth based on piece count */
  TIER3_DEPTH_HIGH: 6,    // ≤8 pieces
  TIER3_DEPTH_MEDIUM: 5,  // 9-12 pieces
  TIER3_DEPTH_LOW: 4,     // >12 pieces

  /** Piece count thresholds for depth selection */
  TIER3_PIECES_HIGH: 8,
  TIER3_PIECES_MEDIUM: 12,
} as const;

/**
 * Evaluation thresholds (in centipawns)
 */
export const EVALUATION_THRESHOLDS = {
  /** Minimum advantage for cooperative AI to play a move (centipawns) */
  COOPERATIVE_ADVANTAGE_CP: 50,

  /** Checkmate score */
  MATE_SCORE: 99999,
} as const;

/**
 * Material values in centipawns
 * Standard chess piece valuations
 */
export const PIECE_VALUES = {
  PAWN: 100,
  KNIGHT: 300,
  BISHOP: 320,
  ROOK: 500,
  QUEEN: 900,
  KING: 0,  // Invaluable - not counted in material
} as const;

/**
 * Endgame detection thresholds
 */
export const ENDGAME_THRESHOLDS = {
  /** Total material threshold for endgame detection (both sides) */
  TOTAL_MATERIAL_CP: 2600,
} as const;

/**
 * Positional evaluation parameters
 */
export const POSITIONAL_PARAMS = {
  /** Maximum board dimension for piece-square table application */
  MAX_PST_DIMENSION: 6,

  /** PST grid size (all tables are 6×6) */
  PST_GRID_SIZE: 6,

  /** Baseline board size for complexity normalization */
  BASELINE_BOARD_SIZE: 12,
} as const;

/**
 * Complexity estimation parameters
 */
export const COMPLEXITY_PARAMS = {
  /** Multiplier for game length estimation */
  GAME_LENGTH_MULTIPLIER: 2,

  /** Baseline board size for normalization */
  BASELINE_SIZE: 12,
} as const;
