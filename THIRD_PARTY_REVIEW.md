# Chess Engine & Solver - Third Party Review Package

## Overview

This document provides everything needed to review the chess engine and solver implementation for a minimalist chess variant game.

**Project:** Thin Chess (1-D Chess & Narrow Board Chess Variants)
**Engine Type:** Multi-variant (supports 1×N and M×N boards)
**Solver Type:** Tri-valued negamax with transposition table (for 1×N variant only)
**Language:** TypeScript (pure functional, zero runtime dependencies)
**Total Engine Code:** ~1000 lines (engine.ts + solver.ts)

---

## Core Files for Review

### 1. Chess Engine: `src/engine.ts` (~950 lines)

**Purpose:** Multi-variant move generation, position encoding, and game state management.

**Key Features:**
- Supports arbitrary board dimensions (1×N for 1-D Chess, M×N for Thin Chess)
- Configurable rule flags (promotion, en passant, fifty-move, threefold, knight models, castling)
- Board-agnostic implementation (works on any NxM grid)
- Pure functional (all operations return new positions, no mutation)

**Important Functions to Review:**
- `legalMoves(pos, rules)` - Move generation (lines ~496-798)
- `applyMove(pos, move, rules)` - Position updates with rule state (lines ~824-928)
- `terminal(pos, rules)` - Game-over detection including draw rules (lines ~887-908)
- `encode(pos)` / `decode(code)` - Position serialization (lines ~283-406)
- `attacked(board, side, idx, config, rules)` - Attack detection for check (lines ~448-488)

**Rule Implementations:**
- **Promotion** (lines ~732-770): Q/R/B/N or freeze on last rank
- **En Passant** (lines ~774-786, 833-860): Target tracking, capture generation, pawn removal
- **Fifty-Move Rule** (lines ~869-884, 853-856): Halfmove clock, auto-draw at 100 plies
- **Threefold Repetition** (lines ~862-867, 920-928): Position hashing, count tracking
- **Knight Model** (lines ~520-540, 403-415): Standard L-shape vs 1D-step variant
- **Castling** (lines ~631-644, 886-922): Scaffolding only (move generation TODO)

### 2. Perfect-Play Solver: `src/solver.ts` (~150 lines)

**Purpose:** Tri-valued negamax solver for 1-D Chess variant only.

**Algorithm:**
- Tri-valued (WIN/LOSS/DRAW) instead of numeric scores
- Transposition table with position string keys
- Cycle detection via path set
- Depth limit: 50 plies (prevents stack overflow)

**Key Functions:**
- `solve(pos, path, depth)` - Recursive negamax (lines ~49-138)
- `keyOf(pos)` - Transposition table key generation (lines ~37-43)

**Why Not Used for Thin Chess:**
- Branching factor ~11 moves (vs ~5 for 1-D Chess)
- Game tree explosion makes perfect-play solver impractical
- Random AI used instead for M×N variants

### 3. Type Definitions: `src/config/GameModeConfig.ts` (~100 lines)

**Purpose:** TypeScript interfaces for rule configuration.

**Key Types:**
- `RuleSet` (lines ~42-49): Rule flag interface
- `GameMode` (lines ~85-99): Game mode configuration including optional rules

---

## Review Focus Areas

### 1. **Correctness**

**Move Generation:**
- [ ] Are legal moves correctly generated for all piece types?
- [ ] Does the knight model switch work correctly (standard vs 1D-step)?
- [ ] Are promotion moves correctly generated (4 options when enabled)?
- [ ] Are en passant captures correctly identified and generated?

**Move Application:**
- [ ] Are en passant captures removing the correct pawn (from EP target, not destination)?
- [ ] Is the halfmove clock correctly incremented/reset?
- [ ] Are castling rights correctly cleared on king/rook moves?
- [ ] Is position history correctly updated for threefold detection?

**Check Detection:**
- [ ] Are attacks correctly detected on arbitrary board sizes?
- [ ] Does `wouldExposeKing()` correctly handle en passant captures?
- [ ] Are discovered checks properly handled?

**Terminal States:**
- [ ] Checkmate vs stalemate correctly distinguished?
- [ ] Fifty-move draw triggered at exactly 100 plies?
- [ ] Threefold repetition correctly counts identical positions?

### 2. **Rule Implementation Fidelity**

**En Passant:**
- [ ] EP target set only after double-step pawn moves?
- [ ] EP target cleared after every move (unless new double-step)?
- [ ] Captured pawn removed from correct square (EP target, not destination)?
- [ ] EP moves correctly detected as non-captures in `wouldExposeKing()`?

**Fifty-Move Rule:**
- [ ] Clock resets on all pawn moves (including promotions)?
- [ ] Clock resets on all captures (including en passant)?
- [ ] Draw triggered at 100 plies (50 full moves)?

**Threefold Repetition:**
- [ ] Position hash includes: board + turn + EP + castling?
- [ ] Draw triggered on 3rd occurrence (not 2nd)?
- [ ] Position history correctly maintained across undo/redo?

**Promotion:**
- [ ] All 4 promotions (Q/R/B/N) generated when enabled?
- [ ] Pawn "freezes" on last rank when promotion disabled?
- [ ] Promotion works on arbitrary board heights?

### 3. **Edge Cases**

**Board Size Independence:**
- [ ] Does the engine work on 1×6, 1×8, 1×12, 2×5, 2×6, 2×10, 3×5, 3×8 boards?
- [ ] Are coordinates correctly calculated for any NxM grid?
- [ ] Do promotion/EP/check work on non-standard sizes?

**Position Encoding:**
- [ ] Can positions be encoded and decoded losslessly?
- [ ] Are extended fields (EP, halfmove, castling) correctly handled?
- [ ] Does encoding preserve all game state needed for rule evaluation?

**Solver:**
- [ ] Does the solver correctly identify forced wins/losses/draws?
- [ ] Are cycles correctly detected as draws?
- [ ] Does the transposition table correctly cache results?
- [ ] Does depth limit prevent stack overflow?

### 4. **Performance**

**Solver Performance:**
- [ ] Typical 1-D Chess position solves in <100ms?
- [ ] Transposition table hit rate reasonable (>50% for repeated positions)?
- [ ] No memory leaks from unbounded TT growth?

**Move Generation:**
- [ ] Legal move generation fast enough for real-time play (<10ms)?
- [ ] No quadratic/exponential complexity in move generation?

### 5. **Code Quality**

**Type Safety:**
- [ ] All functions have correct TypeScript signatures?
- [ ] No `any` types used unsafely?
- [ ] Optional parameters have sensible defaults?

**Functional Purity:**
- [ ] All engine functions are pure (no mutation)?
- [ ] Positions are immutable (new objects returned)?
- [ ] No global state except transposition table?

**Documentation:**
- [ ] Key functions have clear comments?
- [ ] Edge cases documented in code?
- [ ] TODO items clearly marked?

---

## Known Issues & Limitations

### Current Limitations

1. **Castling:** Scaffolding in place but move generation not implemented
   - Rights tracking works (cleared on king/rook moves)
   - TODO at `engine.ts:631-644` shows where to add move generation
   - Rook-specific rights clearing is conservative (clears all rights for side)

2. **Solver Depth Limit:** MAX_DEPTH = 50 prevents stack overflow
   - Positions deeper than 50 plies return "unknown" result
   - Acceptable for 1-D Chess (most positions resolve within 30 plies)

3. **Position History:** Uses in-memory Map (not serialized)
   - Threefold detection works within a game session
   - Lost on page reload (acceptable for web app)

4. **Rook Castling Rights:** Conservative implementation
   - Any rook move clears all castling rights for that side
   - Proper implementation needs to track which rook moved (TODO in code)

### Recent Fixes (October 2025)

1. **En Passant Capture Bug:** Fixed incorrect pawn removal logic
   - Now correctly removes pawn from EP target square (behind destination)
   - Also fixed in `wouldExposeKing()` for check detection

2. **Position State Initialization:** Added proper defaults in `decode()`
   - `halfmoveClock` defaults to 0
   - `castlingRights` defaults to 0
   - `positionHistory` initialized as empty Map

---

## Test Positions

### Test Cases for Reviewers

**1. En Passant Test (2×5 board):**
```
Position: "wp,x/x,x/x,bp/x,x/x,x:w"
After white pawn double-step: "x,x/wp,x/x,bp/x,x/x,x:b"
EP Target should be: square 1 (behind white pawn)
Black pawn on file b, rank 3 should have EP capture available
```

**2. Fifty-Move Rule Test (1×8 board):**
```
Start: "bk,br,x,x,x,x,wr,wk:w"
After 50 rook shuffles (100 plies) with no captures: Should draw
After capture on ply 99: Clock resets, game continues
```

**3. Threefold Repetition Test (1×8 board):**
```
Start: "bk,br,x,x,x,x,wr,wk:w"
Repeat position 3 times via rook shuffles: Should draw
Same board but different EP target: Counts as different position
```

**4. Promotion Test (2×5 board):**
```
Position: "x,x/wp,x/x,x/x,x/x,x:w" (white pawn on rank 4)
promotion=true: Should generate 4 moves (Q/R/B/N)
promotion=false: Pawn can move to rank 5 but stays frozen
```

**5. Knight Model Test (1×8 board):**
```
Position: "bk,x,wn,x,x,x,x,wk:w"
knightModel="standard": Knight moves to index 1 or 5 (±2)
knightModel="1D-step": Knight moves to index 2 or 4 (±1)
```

**6. Solver WIN Position (1×8 board):**
```
Position: "bk,x,x,x,x,x,wr,wk:w"
Expected: WIN for white (rook mates in ~3 moves)
```

**7. Solver DRAW Position (1×8 board):**
```
Position: "bk,br,bn,x,x,wn,wr,wk:w"
Expected: DRAW (balanced starting position)
```

---

## Running the Code

### Setup
```bash
git clone https://github.com/jmtrafny/jmtrafny.github.io.git
cd jmtrafny.github.io
npm install
npm run build  # Verifies TypeScript compilation
npm run dev    # Starts dev server at http://localhost:5173
```

### Testing in Browser
1. Open http://localhost:5173
2. Select "1-D Chess by ChessTraps" mode
3. Click "Solve" to see solver in action
4. Click "Best Move" to execute optimal move
5. Try different positions via Position Editor

### Running Unit Tests (if available)
```bash
npm test  # Run Vitest test suite
```

---

## Questions for Reviewers

### Critical Questions

1. **En Passant Implementation:**
   - Is the EP pawn removal logic correct (removing from EP target square)?
   - Are there edge cases we're missing (e.g., EP capture exposing king to check)?

2. **Position Hashing for Threefold:**
   - Is the hash function sufficient (board + turn + EP + castling)?
   - Should we include halfmove clock in hash?

3. **Solver Correctness:**
   - Are the WIN/LOSS/DRAW evaluations correct?
   - Is cycle detection implemented correctly?
   - Should we cache DRAW results differently than WIN/LOSS?

4. **Board-Agnostic Design:**
   - Does the coordinate system work correctly for all NxM boards?
   - Are there implicit assumptions about board size?

### Optional Questions

5. **Performance Optimizations:**
   - Where are the biggest performance bottlenecks?
   - Should we implement move ordering for the solver?

6. **Code Quality:**
   - Are the function signatures clear and well-typed?
   - Is the code sufficiently documented?

7. **Future Castling Implementation:**
   - What's the best approach for tracking rook starting squares?
   - Should castling rights be stored differently?

---

## Contact & Support

**Repository:** https://github.com/jmtrafny/jmtrafny.github.io
**Live Demo:** https://thinchess.com
**Engine Code:** `src/engine.ts`, `src/solver.ts`
**Documentation:** `DEVELOPER.md`, `README.md`, `ADDING_MODES.md`

**For Questions:**
- Review the code comments in `engine.ts` (most functions documented)
- Check `DEVELOPER.md` for architecture overview
- Open GitHub issue for clarifications

---

## Review Checklist

### Before Review
- [ ] Clone repository and run `npm install`
- [ ] Build succeeds: `npm run build`
- [ ] App runs: `npm run dev`
- [ ] Read this document completely

### During Review
- [ ] Test each rule flag independently with test positions
- [ ] Verify move generation for all piece types
- [ ] Check terminal detection (checkmate, stalemate, draws)
- [ ] Validate solver on known positions
- [ ] Test edge cases (board sizes, corner cases)
- [ ] Review code quality and documentation

### After Review
- [ ] Document findings (correctness issues, performance issues, suggestions)
- [ ] Provide specific line numbers for any bugs found
- [ ] Suggest improvements or optimizations
- [ ] Rate overall code quality (1-10)

---

**Thank you for reviewing our chess engine and solver!**

We appreciate your time and expertise in helping us ensure correctness and quality.
