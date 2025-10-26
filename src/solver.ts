/**
 * Thin Chess Solver
 *
 * Tri-valued perfect-play solver with transposition table and cycle detection.
 * Results are from viewpoint of side-to-move: WIN | LOSS | DRAW
 *
 * Cycle detection: any repeated position in search path = DRAW
 */

import { Position, Move, legalMoves, applyMove, terminal, encode, DEFAULT_RULES, RuleSet } from './engine';

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
 *
 * @param pos - The position to solve
 * @param rules - The rule set to use (defaults to DEFAULT_RULES)
 * @param path - Set of position keys for cycle detection
 * @param depth - Current search depth
 */
export function solve(pos: Position, rules: RuleSet = DEFAULT_RULES, path: Set<string> = new Set(), depth = 0): SolveResult {
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
  const term = terminal(pos, rules);
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
  let maxLosingDepth = -1;
  let losingMove: Move | undefined = undefined;

  const moves = legalMoves(pos, rules);

  // Try each move
  for (const m of moves) {
    const child = applyMove(pos, m, rules);
    const r = solve(child, rules, path, depth + 1);

    // Found a winning move (opponent loses)
    if (r.res === 'LOSS') {
      const score: SolveResult = { res: 'WIN', depth: r.depth + 1, best: m };
      path.delete(key);
      return save(key, score);
    }

    // Track drawing moves (prefer shallowest draw)
    if (r.res === 'DRAW') {
      hasDrawChild = true;
      if (r.depth + 1 < bestDepth) {
        bestDepth = r.depth + 1;
        bestMove = m;
      }
    }

    // Track losing moves (prefer deepest loss to delay mate)
    if (r.res === 'WIN') {
      if (r.depth > maxLosingDepth) {
        maxLosingDepth = r.depth;
        losingMove = m;
      }
    }
  }

  // Remove current position from path before returning
  path.delete(key);

  // If we have a drawing move, take it
  if (hasDrawChild) {
    return save(key, { res: 'DRAW', depth: bestDepth, best: bestMove });
  }

  // All moves lose → return LOSS with move that delays mate longest
  return save(key, { res: 'LOSS', depth: maxLosingDepth + 1, best: losingMove });
}

/**
 * Save result to TT and return it
 */
function save(key: string, val: SolveResult): SolveResult {
  TT.set(key, val);
  return val;
}
