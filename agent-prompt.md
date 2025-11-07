# Code Quality Improvement Agent Prompt

## 🎯 Mission

You are an expert TypeScript/React code quality agent tasked with completing **Phase 2 (Remaining)** and **Phase 3** of a comprehensive code review initiative. Your goal is to improve **maintainability** and **readability** of a production chess application without breaking existing functionality.

---

## 📚 Required Context

**IMPORTANT:** Read `project_status.md` section **"8) Recent Code Quality Improvements (2025-11-06)"** for full context on what has already been completed.

### What Has Been Done ✅

**Phase 1: Correctness Fixes (COMPLETED)**
- Fixed critical check/checkmate notation bug
- Added king existence validation
- Fixed pawn double-move edge cases
- Fixed app startup crash

**Phase 2 (Partial): Maintainability (PARTIALLY COMPLETED)**
- ✅ M1: Created debug logger utility (`src/utils/logger.ts`)
- ✅ M4: Fixed TT clearing bug in `loadPosition()`

### What You Need To Do 📋

**Phase 2 (Remaining):**
- ⏳ M2: Extract magic numbers to constants
- ⏳ M3: Add config object caching
- ⏳ M5: Remove/relocate deprecated exports

**Phase 3 (All):**
- ⏳ R1: Extract complex boolean predicates
- ⏳ R2: Rename confusing functions
- ⏳ R3: Add comprehensive JSDoc

---

## 📋 Task Specifications

### **M2: Extract Magic Numbers to Constants**

**Priority:** HIGH
**Estimated Time:** 1-2 hours
**Files:** `src/solver.ts`, `src/evaluator.ts`, `src/engine.ts`

**Objective:** Create a centralized constants file for all magic numbers currently scattered throughout the codebase.

#### **Step 1: Create Constants File**

Create `src/config/solverConstants.ts`:

```typescript
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
```

#### **Step 2: Update solver.ts**

Replace all magic numbers with constant imports:

**Import at top:**
```typescript
import {
  SOLVER_TIER_THRESHOLDS,
  SOLVER_BUDGETS,
  SEARCH_LIMITS,
  EVALUATION_THRESHOLDS,
  PIECE_VALUES,
} from './config/solverConstants';
```

**Replace instances:**
- Line 104: `const MAX_DEPTH = 30;` → `const MAX_DEPTH = SEARCH_LIMITS.MAX_DEPTH;`
- Line 323: `if (complexity <= 6)` → `if (complexity <= SOLVER_TIER_THRESHOLDS.TIER1_MAX_COMPLEXITY)`
- Line 326: `maxNodes: 10000` → `maxNodes: SOLVER_BUDGETS.TIER1_MAX_NODES`
- Line 326: `maxTTSize: 50000` → `maxTTSize: SOLVER_BUDGETS.TIER1_MAX_TT_SIZE`
- Line 337: `if (complexity <= 12 && moveCount < 30)` → `if (complexity <= SOLVER_TIER_THRESHOLDS.TIER2_MAX_COMPLEXITY && moveCount < SOLVER_TIER_THRESHOLDS.TIER2_MAX_MOVES)`
- Line 341: `maxNodes: 50000` → `maxNodes: SOLVER_BUDGETS.TIER2_MAX_NODES`
- Line 341: `maxTTSize: 100000` → `maxTTSize: SOLVER_BUDGETS.TIER2_MAX_TT_SIZE`
- Line 343: `for (let maxDepth = 1; maxDepth <= 20; maxDepth++)` → `for (let maxDepth = 1; maxDepth <= SOLVER_BUDGETS.TIER2_MAX_DEPTH; maxDepth++)`
- Line 388: `pieceCount <= 8 ? 6 : pieceCount <= 12 ? 5 : 4` → Use `SEARCH_LIMITS.TIER3_*` constants
- Line 239: `-99999` → `-EVALUATION_THRESHOLDS.MATE_SCORE`
- Line 430: `score > 50` → `score > EVALUATION_THRESHOLDS.COOPERATIVE_ADVANTAGE_CP`

#### **Step 3: Update evaluator.ts**

**Import at top:**
```typescript
import { PIECE_VALUES, ENDGAME_THRESHOLDS, POSITIONAL_PARAMS, COMPLEXITY_PARAMS } from './config/solverConstants';
```

**Replace instances:**
- Lines 11-18: Replace `PIECE_VALUES` object with import
- Line 77: `if (boardHeight > 6 || boardWidth > 6)` → `if (boardHeight > POSITIONAL_PARAMS.MAX_PST_DIMENSION || boardWidth > POSITIONAL_PARAMS.MAX_PST_DIMENSION)`
- Line 83-84: Replace `6` with `POSITIONAL_PARAMS.PST_GRID_SIZE`
- Line 122: `totalMaterial < 2600` → `totalMaterial < ENDGAME_THRESHOLDS.TOTAL_MATERIAL_CP`
- Line 174: `pieceCount * boardFactor * 2` → `pieceCount * boardFactor * COMPLEXITY_PARAMS.GAME_LENGTH_MULTIPLIER`

#### **Step 4: Update engine.ts**

**Look for any remaining magic numbers:**
- Search for standalone numbers in conditionals
- Document any board dimension constants
- Add comments explaining why numbers can't be extracted (if any)

#### **Validation:**
- ✅ Run `npm run build` - must pass
- ✅ Run all 20 Los Alamos test positions (see previous agent conversation)
- ✅ Verify solver still selects correct tiers (check console logs in dev mode)

---

### **M3: Add Config Object Caching**

**Priority:** MEDIUM
**Estimated Time:** 1 hour
**Files:** `src/engine.ts`

**Objective:** Cache `BoardConfig` objects to reduce memory allocations in move generation hot paths.

#### **Step 1: Add Cache at Module Level**

In `engine.ts`, after the `CONFIGS` constant (around line 56):

```typescript
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
```

#### **Step 2: Update getConfig() Function**

Replace the existing `getConfig()` function (lines 62-89) with:

```typescript
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
```

#### **Step 3: Add Cache Clearing to Relevant Functions**

In `useGameState.ts`, import and use cache clearing:

```typescript
import { clearConfigCache } from '../engine';

// In newGame action:
clearConfigCache();
clearTT();

// In restart action:
clearConfigCache();
clearTT();
```

#### **Validation:**
- ✅ Run `npm run build` - must pass
- ✅ Test switching between different board sizes (1×8, 1×12, 6×6, 5×5)
- ✅ Verify performance improvement (measure with console.time if needed)
- ✅ Check cache doesn't grow unbounded (should have ~5-10 entries max in typical usage)

---

### **M5: Remove/Relocate Deprecated Exports**

**Priority:** LOW
**Estimated Time:** 30 minutes
**Files:** `src/engine.ts`

**Objective:** Clean up legacy interfaces marked as `@deprecated` to reduce API surface area.

#### **Step 1: Create Legacy File**

Create `src/legacy.ts`:

```typescript
/**
 * Legacy Interfaces and Exports
 *
 * These interfaces are deprecated and maintained only for backward compatibility.
 * DO NOT USE in new code - use GameMode from src/config/GameModeConfig.ts instead.
 *
 * This file may be removed in a future major version.
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

export const SKINNY_MODE_PACK: SkinnyMode[] = [];

export interface ThinMode {
  id: string;
  name: string;
  description: string;
  startPosition: string;
  boardLength: number;
  rationale: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const THIN_MODE_PACK: ThinMode[] = [];

export const MINI_BOARD_PUZZLES_PACK: Array<ThinMode | SkinnyMode> = [];

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

export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {};
```

#### **Step 2: Remove from engine.ts**

Delete lines 254-318 in `engine.ts` (all the deprecated interfaces and exports).

#### **Step 3: Update Any Imports**

Search codebase for any files importing these deprecated interfaces:

```bash
# Search command (run in terminal):
grep -r "SKINNY_MODE_PACK\|THIN_MODE_PACK\|MINI_BOARD_PUZZLES_PACK\|MODE_HELP_CONTENT" src/
```

If any files import them, update to import from `./legacy` instead of `./engine`.

#### **Step 4: Add Note to README**

In `README.md`, add note about legacy exports:

```markdown
### Breaking Changes (v2.0+)

Legacy mode interfaces (`SkinnyMode`, `ThinMode`, etc.) have been moved to `src/legacy.ts`.
If your code imports these, update imports:

```typescript
// Old (deprecated):
import { SKINNY_MODE_PACK } from './engine';

// New:
import { SKINNY_MODE_PACK } from './legacy';
```

**Recommendation:** Migrate to the new configuration system (`public/game-modes.json`) instead.
```

#### **Validation:**
- ✅ Run `npm run build` - must pass
- ✅ Run `grep` to verify no imports remain
- ✅ Check bundle size (should be slightly smaller)

---

### **R1: Extract Complex Boolean Predicates**

**Priority:** MEDIUM
**Estimated Time:** 1-2 hours
**Files:** `src/hooks/useGameState.ts`, `src/App.tsx`

**Objective:** Replace complex nested boolean conditions with named helper functions for better readability.

#### **Step 1: Add Predicate Helpers to useGameState.ts**

After the `canPlayerMovePiece()` function (around line 55), add:

```typescript
/**
 * Check if it's the player's turn in 1-player mode
 * Used to validate player actions and prevent moves on AI's turn
 */
function isPlayerTurnIn1PlayerMode(state: Pick<GameState, 'gameMode' | 'playerSide' | 'position'>): boolean {
  return state.gameMode === '1player'
    && state.playerSide !== null
    && state.position.turn === state.playerSide;
}

/**
 * Check if actions should be blocked due to game state
 * Returns true if AI is thinking, game is over, or no game mode is loaded
 */
function areActionsBlocked(state: Pick<GameState, 'aiThinking' | 'gameOver' | 'currentMode'>): boolean {
  return state.aiThinking || state.gameOver || !state.currentMode;
}

/**
 * Check if undo/redo should be disabled
 */
function canUndo(state: Pick<GameState, 'historyIndex' | 'aiThinking' | 'gameOver'>): boolean {
  return state.historyIndex > 0 && !state.aiThinking && !state.gameOver;
}

function canRedo(state: Pick<GameState, 'historyIndex' | 'history' | 'aiThinking' | 'gameOver'>): boolean {
  return state.historyIndex < state.history.length - 1 && !state.aiThinking && !state.gameOver;
}
```

#### **Step 2: Replace Complex Conditions in useGameState.ts**

**Line 223:** (selectSquare)
```typescript
// Before:
if (prev.aiThinking || prev.gameOver) return prev;

// After:
if (areActionsBlocked(prev)) return prev;
```

**Line 306:** (makeMove)
```typescript
// Before:
if (prev.gameMode === '1player' && prev.playerSide !== null && prev.position.turn === prev.playerSide) {

// After:
if (isPlayerTurnIn1PlayerMode(prev)) {
```

**Line 341:** (undo)
```typescript
// Before:
if (prev.historyIndex <= 0 || prev.aiThinking || prev.gameOver) {

// After:
if (!canUndo(prev)) {
```

**Line 362:** (redo)
```typescript
// Before:
if (prev.historyIndex >= prev.history.length - 1 || prev.aiThinking || prev.gameOver) {

// After:
if (!canRedo(prev)) {
```

#### **Step 3: Add Predicate Helpers to App.tsx**

After the `boardConfig` useMemo (around line 88), add:

```typescript
/**
 * Check if the AI should skip making a move
 * Returns true if it's not AI's turn or game conditions prevent AI from moving
 */
const shouldSkipAIMove = useCallback((state: GameState): boolean => {
  return state.gameMode !== '1player'
    || state.playerSide === null
    || state.position.turn === state.playerSide
    || state.aiThinking
    || state.gameOver;
}, []);
```

#### **Step 4: Replace Complex Conditions in App.tsx**

**Line 171-177:** (AI effect)
```typescript
// Before:
if (
  gameState.gameMode !== '1player' ||
  gameState.playerSide === null ||
  gameState.position.turn === gameState.playerSide ||
  gameState.aiThinking ||
  gameState.gameOver
) {
  return;
}

// After:
if (shouldSkipAIMove(gameState)) {
  return;
}
```

#### **Validation:**
- ✅ Run `npm run build` - must pass
- ✅ Test 1-player mode (AI should still move correctly)
- ✅ Test 2-player mode (both players can move)
- ✅ Test undo/redo buttons (should enable/disable correctly)
- ✅ Test piece selection during AI turn (should be blocked)

---

### **R2: Rename Confusing Functions**

**Priority:** LOW
**Estimated Time:** 1 hour
**Files:** `src/hooks/useGameState.ts`, `src/engine.ts`, `src/solver.ts`

**Objective:** Rename functions that shadow built-ins or have unclear names.

#### **Functions to Rename:**

| Old Name | New Name | Location | Reason |
|----------|----------|----------|--------|
| `getRulesFromMode()` | `extractRules()` | useGameState.ts:27 | Clearer intent, not HTTP GET |
| `keyOf()` | `positionKey()` | solver.ts:57 | More descriptive |
| `save()` | `cacheTTEntry()` | solver.ts:208 | Clearer what it's saving to |
| `typeOf()` | `pieceType()` | engine.ts:524 | Avoid shadowing `typeof` |
| `sideOf()` | `pieceSide()` | engine.ts:518 | Consistency with `pieceType()` |

#### **Step 1: Rename in engine.ts**

**Find all uses of `typeOf` and `sideOf`:**
```bash
# Count occurrences:
grep -n "typeOf\|sideOf" src/engine.ts | wc -l
```

**Use VSCode/editor "Rename Symbol" feature** (F2 in VSCode) to rename:
- `typeOf` → `pieceType` (everywhere in codebase)
- `sideOf` → `pieceSide` (everywhere in codebase)

#### **Step 2: Rename in solver.ts**

Use "Rename Symbol":
- `keyOf` → `positionKey`
- `save` → `cacheTTEntry`

#### **Step 3: Rename in useGameState.ts**

Use "Rename Symbol":
- `getRulesFromMode` → `extractRules`

#### **Step 4: Update Exports**

Make sure to update export statements in each file.

#### **Validation:**
- ✅ Run `npm run build` - must pass
- ✅ Search for old function names (should be 0 results)
- ✅ Run quick game to verify everything still works

---

### **R3: Add Comprehensive JSDoc**

**Priority:** MEDIUM
**Estimated Time:** 2-3 hours
**Files:** All TypeScript files

**Objective:** Add JSDoc comments to all public functions and complex internal functions.

#### **Required JSDoc Format:**

```typescript
/**
 * Brief one-line description
 *
 * Optional longer description with details about the function's behavior,
 * edge cases, and important implementation notes.
 *
 * @param paramName - Description of parameter (include type constraints, valid ranges)
 * @param optionalParam - Description (note if optional and default behavior)
 * @returns Description of return value (include possible values and edge cases)
 * @throws ErrorType - Description of when this error is thrown (if applicable)
 *
 * @example
 * ```typescript
 * const result = functionName(param1, param2);
 * // result => expected output
 * ```
 */
```

#### **Priority Functions to Document:**

**engine.ts (HIGH PRIORITY):**
- ✅ `wouldExposeKing()` - Already done
- `legalMoves()` - Complex, critical function
- `applyMove()` - Complex state updates
- `terminal()` - Multiple return values
- `decode()` - Complex parsing logic
- `encode()` - Complex serialization
- `pieceType()` / `pieceSide()` - Simple but used everywhere
- `findKing()` - Edge case handling
- `attacked()` - Complex attack detection

**solver.ts (HIGH PRIORITY):**
- `solve()` - Main recursive solver
- `solveHybrid()` - Tier selection logic
- `alphaBeta()` - Search algorithm
- `calculateComplexity()` - Formula explanation
- `positionKey()` - Serialization format

**evaluator.ts (MEDIUM PRIORITY):**
- `evaluate()` - Evaluation function
- `getPSTValue()` - Piece-square tables
- `isEndgame()` - Endgame detection
- `estimateComplexity()` - Complexity estimation

**useGameState.ts (MEDIUM PRIORITY):**
- `canPlayerMovePiece()` - Validation logic
- `createInitialState()` - State initialization
- All action functions in `GameActions` interface

#### **Example JSDoc (for reference):**

```typescript
/**
 * Generate all legal moves for the current position
 *
 * Generates pseudo-legal moves for all pieces, then filters out moves
 * that would leave the king in check. Supports both 1-D Chess (1×N)
 * and Thin Chess (M×N) variants with rule-dependent move generation.
 *
 * @param pos - The position to analyze (includes board, turn, variant)
 * @param rules - Rule set configuration (defaults to DEFAULT_RULES if omitted)
 * @returns Array of legal moves with from/to squares and optional promotion
 *
 * @example
 * ```typescript
 * const moves = legalMoves(position, rules);
 * // moves => [{ from: 0, to: 1 }, { from: 0, to: 2, promotion: 'q' }]
 * ```
 */
export function legalMoves(pos: Position, rules: RuleSet = DEFAULT_RULES): Move[] {
  // ... implementation
}
```

#### **Documentation Checklist:**

**engine.ts:**
- [ ] `legalMoves()`
- [ ] `applyMove()`
- [ ] `terminal()`
- [ ] `decode()`
- [ ] `encode()`
- [ ] `pieceType()`
- [ ] `pieceSide()`
- [ ] `findKing()`
- [ ] `attacked()`
- [ ] `getConfig()`
- [ ] `getRookSquares()`
- [ ] `getInitialCastlingRights()`

**solver.ts:**
- [ ] `solve()`
- [ ] `solveHybrid()`
- [ ] `alphaBeta()`
- [ ] `calculateComplexity()`
- [ ] `positionKey()`
- [ ] `cacheTTEntry()`
- [ ] `clearTT()`
- [ ] `getTTSize()`

**evaluator.ts:**
- [ ] `evaluate()`
- [ ] `getPSTValue()`
- [ ] `isEndgame()`
- [ ] `estimateComplexity()`

**useGameState.ts:**
- [ ] `canPlayerMovePiece()`
- [ ] `createInitialState()`
- [ ] `selectSquare()`
- [ ] `makeMove()`
- [ ] `undo()`
- [ ] `redo()`
- [ ] `newGame()`
- [ ] `restart()`
- [ ] `loadPosition()`

#### **Validation:**
- ✅ Run `npm run build` - must pass (JSDoc shouldn't affect compilation)
- ✅ Generate TypeDoc documentation (optional: `npm install -D typedoc && npx typedoc`)
- ✅ Review generated docs for completeness

---

## 🎯 Success Criteria

### **For Each Task:**
1. ✅ TypeScript compilation passes (`npm run build`)
2. ✅ No new warnings or errors
3. ✅ All Los Alamos test positions work correctly (see section 10 below)
4. ✅ Bundle size doesn't increase significantly (±2KB acceptable)
5. ✅ No runtime errors in browser console

### **Overall:**
- ✅ Code is more maintainable (constants centralized, cache reduces allocations)
- ✅ Code is more readable (predicates have names, functions renamed, JSDoc added)
- ✅ No functionality broken
- ✅ Performance maintained or improved

---

## 📦 Deliverables

When complete, provide:

1. **Summary Document:**
   - List of all files changed
   - Number of magic numbers extracted
   - Number of functions renamed
   - Number of functions documented
   - Any issues encountered and how you resolved them

2. **Testing Report:**
   - Results of `npm run build`
   - Results of manual testing with Los Alamos positions
   - Bundle size before/after
   - Any performance measurements

3. **Updated project_status.md:**
   - Mark all tasks as ✅ COMPLETED
   - Update metrics (e.g., "Code documentation: Comprehensive")

---

## 🚨 Important Guidelines

### **DO:**
- ✅ Run `npm run build` after EVERY change
- ✅ Test incrementally (don't change everything at once)
- ✅ Keep commits atomic (one task per commit)
- ✅ Use TypeScript's "Rename Symbol" feature (F2 in VSCode) to ensure all references are updated
- ✅ Add JSDoc to exported functions first, then internal functions
- ✅ Reference the existing logger utility in `src/utils/logger.ts` as a model

### **DON'T:**
- ❌ Change any game logic or algorithms
- ❌ Modify the solver's behavior (only extract constants)
- ❌ Rename exported types used by external code
- ❌ Remove any functionality
- ❌ Add new dependencies (unless absolutely necessary)
- ❌ Change line endings or formatting (keep existing style)

### **IF STUCK:**
- Read `project_status.md` for context
- Check existing code patterns (e.g., logger utility)
- Look for similar implementations in the codebase
- Test smaller changes first before complex refactors

---

## 📍 Reference: Los Alamos Test Positions

**Quick smoke test** (run these after major changes):

1. **Valid starting position:**
   ```
   bn,br,bq,bk,br,bn/bp,bp,bp,bp,bp,bp/x,x,x,x,x,x/x,x,x,x,x,x/wp,wp,wp,wp,wp,wp/wn,wr,wq,wk,wr,wn:w
   ```

2. **Simple check:**
   ```
   x,x,x,bk,x,x/x,x,x,x,x,x/x,x,x,x,x,x/x,x,x,x,x,x/x,x,x,x,x,x/x,x,wr,wk,x,x:w
   ```
   Move wr from c1 to c6 → Should show `Rc6+`

3. **Checkmate:**
   ```
   x,x,x,bk,x,x/x,x,x,x,x,x/x,x,x,x,x,x/x,x,x,x,x,x/x,x,x,x,x,x/wr,x,x,wk,x,x:w
   ```
   Move wr from a1 to a6 → Should show `Ra6#`

4. **Invalid position (should error):**
   ```
   bn,br,bq,x,br,bn/bp,bp,bp,bp,bp,bp/x,x,x,x,x,x/x,x,x,x,x,x/wp,wp,wp,wp,wp,wp/wn,wr,wq,wk,wr,wn:w
   ```
   Should show: "Invalid position: Black king not found"

**If all 4 tests pass, your changes are likely safe.**

---

## 🎉 Final Notes

This is a well-architected codebase with:
- ✅ TypeScript strict mode
- ✅ No `any` types
- ✅ Comprehensive test positions
- ✅ Good separation of concerns

Your improvements will make it even better! Focus on **maintainability** and **readability** without breaking the excellent foundation that's already in place.

**Good luck, and thank you for improving this codebase!** 🚀

---

**End of Agent Prompt**
