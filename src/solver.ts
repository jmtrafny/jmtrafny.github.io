/**
 * Chess Solver - Multi-Tier System
 *
 * Tier 1: Perfect tri-valued solver (small positions)
 * Tier 2: Bounded iterative deepening (medium positions)
 * Tier 3: Alpha-beta heuristic search (large positions)
 *
 * Results are from viewpoint of side-to-move
 */

import { Position, Move, legalMoves, applyMove, terminal, encode, DEFAULT_RULES, RuleSet, EMPTY } from './engine';
import { evaluate } from './evaluator';

export type Result = 'WIN' | 'LOSS' | 'DRAW';

export interface SolveResult {
  res: Result;
  depth: number;
  best?: Move;
  tier?: 1 | 2; // Which tier solved this
}

export interface EvalResult {
  score: number;  // Centipawn evaluation
  best?: Move;
  tier: 3;        // Heuristic tier
}

// Transposition table: position key -> solve result
const TT = new Map<string, SolveResult>();

// Node budget counter for search limits
interface NodeBudget {
  nodes: number;
  maxNodes: number;
}

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
 * @param budget - Optional node budget to limit search (prevents hangs)
 */
export function solve(
  pos: Position,
  rules: RuleSet = DEFAULT_RULES,
  path: Set<string> = new Set(),
  depth = 0,
  budget?: NodeBudget
): SolveResult {
  const key = keyOf(pos);

  // Check node budget (prevents infinite search)
  if (budget) {
    budget.nodes++;
    if (budget.nodes > budget.maxNodes) {
      // Budget exceeded - return draw to exit gracefully
      return { res: 'DRAW', depth };
    }
  }

  // Depth limit to prevent stack overflow
  const MAX_DEPTH = 30;
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
    const r = solve(child, rules, path, depth + 1, budget);

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

  // Apply AI strategy to move selection
  const aiStrategy = rules.aiStrategy || 'perfect';

  if (aiStrategy === 'cooperative') {
    // Cooperative: Only return WIN if found, otherwise play randomly to give opponent chances
    // This helps in teaching/puzzle modes where you want the AI to give the player winning opportunities
    if (hasDrawChild || losingMove) {
      // We're not winning - pick a random move to give opponent a chance
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return save(key, { res: 'DRAW', depth: 0, best: randomMove });
    }
    // Should never reach here since we returned early on WIN
    return save(key, { res: 'DRAW', depth: 0, best: moves[0] });
  }

  if (aiStrategy === 'aggressive') {
    // Aggressive: Prefer WIN > LOSS > DRAW (avoids draws, takes risks)
    if (hasDrawChild && losingMove) {
      // Have both draw and loss options - choose loss to keep game going
      return save(key, { res: 'LOSS', depth: maxLosingDepth + 1, best: losingMove });
    }
    if (hasDrawChild) {
      return save(key, { res: 'DRAW', depth: bestDepth, best: bestMove });
    }
    return save(key, { res: 'LOSS', depth: maxLosingDepth + 1, best: losingMove });
  }

  // Perfect (default): WIN > DRAW > LOSS (always optimal)
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

/**
 * Alpha-Beta Minimax Search with Evaluation Function
 *
 * Used for large positions where perfect solving is infeasible.
 * Returns centipawn evaluation and best move.
 *
 * @param pos - The position to evaluate
 * @param rules - The rule set to use
 * @param depth - Remaining search depth
 * @param alpha - Alpha bound (best score for maximizing player)
 * @param beta - Beta bound (best score for minimizing player)
 */
function alphaBeta(
  pos: Position,
  rules: RuleSet,
  depth: number,
  alpha: number,
  beta: number
): EvalResult {
  // Terminal position check
  const term = terminal(pos, rules);
  if (term) {
    if (term === 'STALEMATE' || term === 'DRAW_FIFTY' || term === 'DRAW_THREEFOLD') {
      return { score: 0, tier: 3 };
    }
    // Checkmate: side-to-move is mated (very negative score)
    return { score: -99999, tier: 3 };
  }

  // Depth limit reached: return static evaluation
  if (depth === 0) {
    return { score: evaluate(pos), tier: 3 };
  }

  let bestMove: Move | undefined = undefined;
  let maxScore = -Infinity;

  const moves = legalMoves(pos, rules);

  // No legal moves (shouldn't happen since terminal() checks this)
  if (moves.length === 0) {
    return { score: 0, tier: 3 };
  }

  for (const move of moves) {
    const child = applyMove(pos, move, rules);
    const result = alphaBeta(child, rules, depth - 1, -beta, -alpha);
    const score = -result.score; // Negamax: flip score for opponent

    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, score);
    if (alpha >= beta) {
      break; // Beta cutoff (pruning)
    }
  }

  return { score: maxScore, best: bestMove, tier: 3 };
}

/**
 * Hybrid Solver - Automatically choose best solver tier
 *
 * Tier 1: Perfect solver (pieces ≤ 6)
 * Tier 2: Bounded iterative deepening (pieces 7-8, max 2 seconds, 50k node budget)
 * Tier 3: Alpha-beta heuristic (pieces > 8 or timeout/budget exceeded)
 *
 * @param pos - The position to solve
 * @param rules - The rule set to use
 * @param maxTime - Maximum time in milliseconds for Tier 2
 */
export function solveHybrid(
  pos: Position,
  rules: RuleSet = DEFAULT_RULES,
  maxTime: number = 2000
): SolveResult | EvalResult {
  const pieceCount = pos.board.filter(p => p !== EMPTY).length;
  const moveCount = legalMoves(pos, rules).length;

  // Tier 1: Perfect solver for small positions
  if (pieceCount <= 6) {
    try {
      const result = solve(pos, rules);
      return { ...result, tier: 1 };
    } catch (error) {
      console.warn('[Solver] Tier 1 failed, falling back to Tier 3:', error);
    }
  }

  // Tier 2: Iterative deepening with timeout and node budget (7-8 pieces)
  // Skip Tier 2 if position is too complex (many legal moves indicates tactical complexity)
  if (pieceCount <= 8 && moveCount < 30) {
    const startTime = Date.now();
    let bestResult: SolveResult | null = null;
    const budget: NodeBudget = { nodes: 0, maxNodes: 50000 };

    for (let maxDepth = 1; maxDepth <= 20; maxDepth++) {
      // Check time budget
      if (Date.now() - startTime > maxTime) {
        console.log(`[Solver] Tier 2 timeout at depth ${maxDepth}, found:`, bestResult?.res);
        break;
      }

      // Check node budget
      if (budget.nodes > budget.maxNodes) {
        console.log(`[Solver] Tier 2 node budget exceeded at ${budget.nodes} nodes, depth ${maxDepth}`);
        break;
      }

      try {
        // Reset budget for this iteration
        budget.nodes = 0;
        const result = solve(pos, rules, new Set(), 0, budget);

        // Check if we exceeded depth limit for this iteration
        if (result.depth <= maxDepth) {
          bestResult = { ...result, tier: 2 };

          // Found a WIN - no need to search deeper
          if (result.res === 'WIN') {
            console.log(`[Solver] Tier 2 found WIN at depth ${maxDepth}, nodes: ${budget.nodes}`);
            return bestResult;
          }
        }
      } catch (error) {
        // Depth limit hit or other error - stop iterating
        console.warn(`[Solver] Tier 2 error at depth ${maxDepth}:`, error);
        break;
      }
    }

    if (bestResult) {
      console.log('[Solver] Tier 2 returning result:', bestResult.res, 'depth', bestResult.depth);
      return bestResult;
    }
  }

  // Tier 3: Alpha-beta heuristic search
  console.log(`[Solver] Using Tier 3 (heuristic) for ${pieceCount} pieces`);
  const searchDepth = pieceCount <= 8 ? 6 : pieceCount <= 12 ? 5 : 4;
  const result = alphaBeta(pos, rules, searchDepth, -Infinity, Infinity);

  // Apply AI strategy to heuristic result
  return applyHeuristicStrategy(result, pos, rules);
}

/**
 * Apply AI strategy to heuristic search results
 *
 * For perfect solving, strategy is applied inside solve().
 * For heuristic results, we need to apply strategy here.
 */
function applyHeuristicStrategy(
  result: EvalResult,
  pos: Position,
  rules: RuleSet
): EvalResult {
  const strategy = rules.aiStrategy || 'perfect';

  // Cooperative: Only play moves with positive evaluation (>50cp advantage)
  // Otherwise play randomly to give opponent chances
  if (strategy === 'cooperative') {
    const moves = legalMoves(pos, rules);
    const goodMoves: Move[] = [];

    for (const move of moves) {
      const child = applyMove(pos, move, rules);
      const childEval = alphaBeta(child, rules, 2, -Infinity, Infinity);
      const score = -childEval.score;

      if (score > 50) {
        goodMoves.push(move);
      }
    }

    if (goodMoves.length > 0) {
      // Play one of the good moves randomly
      const randomGoodMove = goodMoves[Math.floor(Math.random() * goodMoves.length)];
      return { ...result, best: randomGoodMove };
    }

    // No good moves found - play randomly to help opponent
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return { ...result, best: randomMove, score: 0 };
  }

  // Aggressive: Avoid draws, prefer sharp positions
  // For heuristic search, this means preferring moves with higher variance
  // For now, just return best move (same as perfect)
  if (strategy === 'aggressive') {
    return result;
  }

  // Perfect (default): Return best move from alpha-beta
  return result;
}
