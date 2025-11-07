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
import { createLogger } from './utils/logger';

const log = createLogger('Solver');

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
  ttSize?: number;      // Current TT size (optional tracking)
  maxTTSize?: number;   // Maximum TT size before bailing out
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

    // Check TT size budget (prevents memory exhaustion)
    if (budget.maxTTSize && TT.size > budget.maxTTSize) {
      log.warn(`TT size limit exceeded: ${TT.size} > ${budget.maxTTSize}`);
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
 * Calculate position complexity score
 * Factors in both piece count and board size
 * Higher scores = more complex positions requiring more computation
 *
 * @param pos - The position to evaluate
 * @param pieceCount - Number of pieces on board
 * @returns Complexity score (typically 0-20)
 */
function calculateComplexity(pos: Position, pieceCount: number): number {
  const config = { size: pos.board.length };
  const boardSize = config.size;

  // Baseline: 1×12 board (size=12) has factor 1.0
  // 6×6 board (size=36) has factor 1.73
  // Formula: complexity = pieces × sqrt(boardSize / 12)
  const boardFactor = Math.sqrt(boardSize / 12);
  return pieceCount * boardFactor;
}

/**
 * Hybrid Solver - Automatically choose best solver tier
 *
 * Tier 1: Perfect solver (complexity ≤ 6, roughly ≤6 pieces on 1×12 or ≤3 pieces on 6×6)
 * Tier 2: Bounded iterative deepening (complexity ≤ 12, moves < 30, with memory limits)
 * Tier 3: Alpha-beta heuristic (high complexity or timeout/budget exceeded)
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
  try {
    const pieceCount = pos.board.filter(p => p !== EMPTY).length;
    const moveCount = legalMoves(pos, rules).length;
    const complexity = calculateComplexity(pos, pieceCount);

  // Tier 1: Perfect solver for simple positions only
  // Use complexity score instead of raw piece count to account for board size
  if (complexity <= 6) {
    try {
      log.debug(`Attempting Tier 1 (complexity=${complexity.toFixed(2)}, pieces=${pieceCount})`);
      const budget: NodeBudget = { nodes: 0, maxNodes: 10000, maxTTSize: 50000 };
      const result = solve(pos, rules, new Set(), 0, budget);
      log.debug(`Tier 1 success: ${result.res} (nodes: ${budget.nodes}, TT size: ${TT.size})`);
      return { ...result, tier: 1 };
    } catch (error) {
      log.warn('Tier 1 failed, falling back to Tier 3:', error);
    }
  }

  // Tier 2: Iterative deepening with timeout and node budget
  // Use complexity threshold and move count to filter out overly complex positions
  if (complexity <= 12 && moveCount < 30) {
    log.debug(`Attempting Tier 2 (complexity=${complexity.toFixed(2)}, pieces=${pieceCount}, moves=${moveCount})`);
    const startTime = Date.now();
    let bestResult: SolveResult | null = null;
    const budget: NodeBudget = { nodes: 0, maxNodes: 50000, maxTTSize: 100000 };

    for (let maxDepth = 1; maxDepth <= 20; maxDepth++) {
      // Check time budget
      if (Date.now() - startTime > maxTime) {
        log.debug(`Tier 2 timeout at depth ${maxDepth}, found:`, bestResult?.res);
        break;
      }

      // Check node budget
      if (budget.nodes > budget.maxNodes) {
        log.debug(`Tier 2 node budget exceeded at ${budget.nodes} nodes, depth ${maxDepth}`);
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
            log.debug(`Tier 2 found WIN at depth ${maxDepth}, nodes: ${budget.nodes}, TT size: ${TT.size}`);
            return bestResult;
          }
        }
      } catch (error) {
        // Depth limit hit, memory error, or other issue - stop iterating and fall back
        log.warn(`Tier 2 error at depth ${maxDepth}:`, error);
        if (bestResult) {
          log.debug('Tier 2 returning partial result before error');
          return bestResult;
        }
        // No partial result - will fall through to Tier 3
        break;
      }
    }

    if (bestResult) {
      log.debug('Tier 2 returning result:', bestResult.res, 'depth', bestResult.depth);
      return bestResult;
    }
  }

    // Tier 3: Alpha-beta heuristic search
    log.debug(`Using Tier 3 (heuristic) for complexity=${complexity.toFixed(2)}, pieces=${pieceCount}`);
    const searchDepth = pieceCount <= 8 ? 6 : pieceCount <= 12 ? 5 : 4;
    const result = alphaBeta(pos, rules, searchDepth, -Infinity, Infinity);

    // Apply AI strategy to heuristic result
    return applyHeuristicStrategy(result, pos, rules);
  } catch (error) {
    // Emergency fallback: if anything goes wrong, return a safe heuristic result
    log.error('Critical error in solveHybrid, using emergency fallback:', error);
    const moves = legalMoves(pos, rules);
    if (moves.length === 0) {
      // No legal moves - this shouldn't happen but handle gracefully
      return { score: 0, tier: 3 };
    }
    // Return first legal move with neutral evaluation
    return { score: 0, best: moves[0], tier: 3 };
  }
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
