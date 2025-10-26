/**
 * Thin Chess Solver
 *
 * Tri-valued perfect-play solver with transposition table and cycle detection.
 * Results are from viewpoint of side-to-move: WIN | LOSS | DRAW
 *
 * Cycle detection: any repeated position in search path = DRAW
 *
 * NOTE: Solver uses DEFAULT_RULES since it operates at the engine level
 * without awareness of specific game mode configurations.
 */

import { Position, Move, legalMoves, applyMove, terminal, encode, DEFAULT_RULES } from './engine';

export type Result = 'WIN' | 'LOSS' | 'DRAW';

export interface SolveResult {
  res: Result;
  depth: number;
  best?: Move;
}

// Transposition table: position key -> solve result
const TT = new Map<string, SolveResult>();

/**
 * Clear the transposition table (useful for position resets)
 */
export function clearTT(): void {
  TT.clear();
}

/**
 * Get TT size (for debugging/stats)
 */
export function getTTSize(): number {
  return TT.size;
}

/**
 * Position key for transposition table
 * Use extended format to include all position state (EP, halfmove clock, castling)
 */
function keyOf(pos: Position): string {
  return encode(pos, true);
}

/**
 * Solve a position recursively with cycle detection
 *
 * Returns:
 * - WIN: current side can force a win
 * - LOSS: current side will lose with perfect play
 * - DRAW: position is drawn (stalemate or repetition fortress)
 */
export function solve(pos: Position, path: Set<string> = new Set(), depth = 0): SolveResult {
  const key = keyOf(pos);

  // Depth limit to prevent stack overflow
  const MAX_DEPTH = 50;
  if (depth > MAX_DEPTH) {
    return { res: 'DRAW', depth: MAX_DEPTH };
  }

  // Transposition table hit
  if (TT.has(key)) {
    return TT.get(key)!;
  }

  // Cycle detection: repetition = draw
  if (path.has(key)) {
    return { res: 'DRAW', depth: 0 };
  }

  // Terminal position check
  const term = terminal(pos, DEFAULT_RULES);
  if (term) {
    if (term === 'STALEMATE' || term === 'DRAW_FIFTY' || term === 'DRAW_THREEFOLD') {
      return save(key, { res: 'DRAW', depth: 0 });
    }
    // Checkmate: side-to-move is mated (LOSS)
    return save(key, { res: 'LOSS', depth: 0 });
  }

  // Add current position to path for cycle detection
  path.add(key);

  let bestMove: Move | undefined = undefined;
  let bestDepth = Infinity;
  let hasDrawChild = false;

  const moves = legalMoves(pos, DEFAULT_RULES);

  // Try each move
  for (const m of moves) {
    const child = applyMove(pos, m, DEFAULT_RULES);
    const r = solve(child, path, depth + 1);

    // Found a winning move (opponent loses)
    if (r.res === 'LOSS') {
      const score: SolveResult = { res: 'WIN', depth: r.depth + 1, best: m };
      path.delete(key);
      return save(key, score);
    }

    // Track drawing moves
    if (r.res === 'DRAW') {
      hasDrawChild = true;
      if (r.depth + 1 < bestDepth) {
        bestDepth = r.depth + 1;
        bestMove = m;
      }
    }

    // If child is WIN for opponent, it's bad for us; keep searching
  }

  path.delete(key);

  // If we have a drawing move, take it
  if (hasDrawChild) {
    return save(key, { res: 'DRAW', depth: bestDepth, best: bestMove });
  }

  // All moves lose → we're in LOSS; pick move that delays mate longest
  let maxDepth = -1;
  let delaying: Move | undefined = undefined;

  for (const m of legalMoves(pos, DEFAULT_RULES)) {
    const r = solve(applyMove(pos, m, DEFAULT_RULES), new Set(), depth + 1);
    if (r.depth > maxDepth) {
      maxDepth = r.depth;
      delaying = m;
    }
  }

  return save(key, { res: 'LOSS', depth: maxDepth + 1, best: delaying });
}

/**
 * Save result to TT and return it
 */
function save(key: string, val: SolveResult): SolveResult {
  TT.set(key, val);
  return val;
}
