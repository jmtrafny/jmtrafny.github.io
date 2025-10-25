# Game Modes Reference

Complete technical reference for all game modes in 1-D Chess and Thin Chess variants.

## Table of Contents
1. [1-D Chess Modes](#1-d-chess-modes) (5 modes)
2. [Thin Chess Modes](#thin-chess-modes) (6 modes)
3. [Implementation Details](#implementation-details)
4. [Adding Custom Modes](#adding-custom-modes)

---

## 1-D Chess Modes

### Mode 1: Original 1-D Chess (1×12)

**ID:** `original-1d-chess`
**Board:** 1 file × 12 ranks
**Difficulty:** ⭐⭐⭐⭐ Classic
**Type:** Strategic Battle

**Starting Position:**
```
12  bk    ← Black King
11  br    ← Black Rook
10  bn    ← Black Knight
 9  br    ← Black Rook
 8  bn    ← Black Knight
 7  x     ← Empty
 6  x     ← Empty
 5  wn    ← White Knight
 4  wr    ← White Rook
 3  wn    ← White Knight
 2  wr    ← White Rook
 1  wk    ← White King
```

**Position String:**
```typescript
'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w'
```

**Implementation:**
```typescript
{
  id: 'original-1d-chess',
  name: 'Original 1-D Chess',
  description: '12 squares - Full classic setup',
  startPosition: 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
  boardLength: 12,
  rationale: 'Classic 12-square 1-D chess with full piece complement (2 knights, 2 rooks per side). Rich strategic depth.',
  difficulty: 'Classic',
}
```

**Piece Analysis:**
- White: King, 2 Rooks, 2 Knights
- Black: King, 2 Rooks, 2 Knights
- **Total:** 10 pieces, 2 empty squares

**Tactical Themes:**
- Rook coordination and pawn-less endgames
- Knight fork patterns
- Central square control (positions 5-7)
- Multi-piece coordination

---

### Mode 2: Minimal Knights Duel (1×6)

**ID:** `minimal-knights-duel`
**Board:** 1 file × 6 ranks
**Difficulty:** ⭐⭐ Puzzle
**Solo Play Rating:** 7/10
**Type:** Tactical Puzzle

**Starting Position:**
```
6  bk    ← Black King
5  bn    ← Black Knight
4  x     ← Empty
3  x     ← Empty
2  wn    ← White Knight
1  wk    ← White King
```

**Position String:**
```typescript
'wk,wn,x,x,bn,bk:w'
```

**Implementation:**
```typescript
{
  id: 'minimal-knights-duel',
  name: 'Minimal Knights Duel',
  description: '6 squares - Quick tactical puzzle (7/10)',
  startPosition: 'wk,wn,x,x,bn,bk:w',
  boardLength: 6,
  rationale: 'Symmetric endgame distilling chess to tactical essence...',
  difficulty: 'Puzzle',
}
```

**Piece Analysis:**
- White: King, Knight
- Black: King, Knight
- **Total:** 4 pieces, 2 empty squares

**Tactical Themes:**
- Knight ±2 jump mechanics
- King safety and opposition
- First-move advantage
- Tempo and timing

---

### Mode 3: Classic 1D Chess (1×8)

**ID:** `classic-1d-chess`
**Board:** 1 file × 8 ranks
**Difficulty:** ⭐⭐⭐ Classic
**Solo Play Rating:** 8/10
**Type:** Strategic Puzzle (Martin Gardner)

**Starting Position:**
```
8  bk    ← Black King
7  br    ← Black Rook
6  bn    ← Black Knight
5  x     ← Empty
4  x     ← Empty
3  wr    ← White Rook
2  wn    ← White Knight
1  wk    ← White King
```

**Position String:**
```typescript
'wk,wn,wr,x,x,bn,br,bk:w'
```

**Implementation:**
```typescript
{
  id: 'classic-1d-chess',
  name: 'Classic 1D Chess',
  description: '8 squares - Martin Gardner variant (8/10)',
  startPosition: 'wk,wn,wr,x,x,bn,br,bk:w',
  boardLength: 8,
  rationale: 'The classic 1D chess setup originally described by Martin Gardner...',
  difficulty: 'Classic',
}
```

**Piece Analysis:**
- White: King, Rook, Knight
- Black: King, Rook, Knight
- **Total:** 6 pieces, 2 empty squares

**Tactical Themes:**
- **Proven:** White has forced win with perfect play
- Rook and knight coordination
- Piece parity concepts
- Symmetric position breaking

---

### Mode 4: Rook vs Rook & Knight (1×9)

**ID:** `rook-vs-rook-knight`
**Board:** 1 file × 9 ranks
**Difficulty:** ⭐⭐⭐ Asymmetric
**Solo Play Rating:** 7/10
**Type:** Imbalance Challenge

**Starting Position:**
```
9  bk    ← Black King
8  br    ← Black Rook
7  bn    ← Black Knight
6  x     ← Empty
5  x     ← Empty
4  x     ← Empty
3  x     ← Empty
2  wr    ← White Rook
1  wk    ← White King
```

**Position String:**
```typescript
'wk,wr,x,x,x,x,bn,br,bk:w'
```

**Implementation:**
```typescript
{
  id: 'rook-vs-rook-knight',
  name: 'Rook vs Rook & Knight',
  description: '9 squares - Power vs numbers (7/10)',
  startPosition: 'wk,wr,x,x,x,x,bn,br,bk:w',
  boardLength: 9,
  rationale: 'White has lone rook facing Black\'s rook+knight team...',
  difficulty: 'Asymmetric',
}
```

**Piece Analysis:**
- White: King, Rook
- Black: King, Rook, Knight
- **Total:** 5 pieces, 4 empty squares
- **Imbalance:** Power (rook) vs Numbers (rook+knight)

**Tactical Themes:**
- Long-range power vs coordination
- Knight fork threats
- Using superior range to dominate
- Defending against combined forces

---

### Mode 5: Two Knights vs Rook (1×7)

**ID:** `two-knights-vs-rook`
**Board:** 1 file × 7 ranks
**Difficulty:** ⭐⭐⭐ Asymmetric
**Solo Play Rating:** 8/10
**Type:** Imbalance Challenge

**Starting Position:**
```
7  bk    ← Black King
6  br    ← Black Rook
5  x     ← Empty
4  x     ← Empty
3  wn    ← White Knight
2  wn    ← White Knight
1  wk    ← White King
```

**Position String:**
```typescript
'wk,wn,wn,x,x,br,bk:w'
```

**Implementation:**
```typescript
{
  id: 'two-knights-vs-rook',
  name: 'Two Knights vs Rook',
  description: '7 squares - Mobility vs power (8/10)',
  startPosition: 'wk,wn,wn,x,x,br,bk:w',
  boardLength: 7,
  rationale: 'Asymmetric battle where White\'s two knights must work in tandem...',
  difficulty: 'Asymmetric',
}
```

**Piece Analysis:**
- White: King, 2 Knights
- Black: King, Rook
- **Total:** 5 pieces, 2 empty squares
- **Imbalance:** Mobility (2 knights) vs Power (rook)

**Tactical Themes:**
- Two-piece coordination
- Knight fork combinations
- Rook's need for open lines
- Mobility vs power trade-offs

---

## Thin Chess Modes

### Mode 6: Top-Rank Guillotine (2×10)

**ID:** `top-rank-guillotine`
**Board:** 2 files (a-b) × 10 ranks
**Difficulty:** ⭐ Beginner
**Solo Play Rating:** 6/10
**Type:** Endgame Puzzle

**Starting Position:**
```
Rank 10:  x  bk    ← Black King trapped
Rank  9:  x  x
Rank  8:  x  x
Rank  7:  x  x
Rank  6:  x  x
Rank  5:  x  x
Rank  4:  x  x
Rank  3:  wk x     ← White King
Rank  2:  wr x     ← White Rook
Rank  1:  x  x
          a  b
```

**Position String:**
```typescript
'x,bk/x,x/x,x/x,x/x,x/x,x/x,x/wk,x/wr,x/x,x/x,x:w'
```

**Implementation:**
```typescript
{
  id: 'top-rank-guillotine',
  name: 'Top-Rank Guillotine',
  description: 'Mate in 2-3 moves (6/10)',
  startPosition: 'x,bk/x,x/x,x/x,x/x,x/x,x/wk,x/wr,x/x,x/x,x:w',
  rationale: 'Classic K+R vs K endgame on 2×10 board...',
  difficulty: 'Puzzle',
}
```

**Piece Analysis:**
- White: King (a3), Rook (a2)
- Black: King (b10)
- **Total:** 3 pieces, 17 empty squares

**Tactical Themes:**
- K+R vs K mating technique
- Rook ladder pattern
- King support and opposition
- Edge checkmate

---

### Mode 7: Mirror Towers (2×10)

**ID:** `mirror-towers`
**Board:** 2 files (a-b) × 10 ranks
**Difficulty:** ⭐⭐⭐ Advanced
**Solo Play Rating:** 9/10
**Type:** Strategic Battle (Standard Opening)

**Starting Position:**
```
Rank 10:  x  bk    ← Black King
Rank  9:  x  bb    ← Black Bishop
Rank  8:  x  bn    ← Black Knight
Rank  7:  x  br    ← Black Rook
Rank  6:  x  x
Rank  5:  x  x
Rank  4:  wr x     ← White Rook
Rank  3:  wn x     ← White Knight
Rank  2:  wb x     ← White Bishop
Rank  1:  wk x     ← White King
          a  b
```

**Position String:**
```typescript
'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w'
```

**Implementation:**
```typescript
{
  id: 'mirror-towers',
  name: 'Mirror Towers',
  description: 'Standard opening - balanced game (9/10)',
  startPosition: 'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w',
  rationale: 'Standard Thin Chess opening with mirrored pieces...',
  difficulty: 'Baseline',
}
```

**Piece Analysis:**
- White: King, Bishop, Knight, Rook (all on a-file)
- Black: King, Bishop, Knight, Rook (all on b-file)
- **Total:** 8 pieces, 12 empty squares

**Tactical Themes:**
- Piece development in confined space
- Fork and pin patterns
- Bishop color-complex strategy
- Rook control of central ranks

---

### Mode 8: Pawn Corridors (2×10)

**ID:** `pawn-corridors`
**Board:** 2 files (a-b) × 10 ranks
**Difficulty:** ⭐⭐⭐ Intermediate
**Solo Play Rating:** 7/10
**Type:** Race Puzzle

**Starting Position:**
```
Rank 10:  x  bk    ← Black King
Rank  9:  x  bb    ← Black Bishop
Rank  8:  x  bn    ← Black Knight
Rank  7:  x  br    ← Black Rook
Rank  6:  x  x
Rank  5:  x  bp    ← Black Pawn
Rank  4:  wp x     ← White Pawn (far advanced!)
Rank  3:  wr x     ← White Rook
Rank  2:  wn x     ← White Knight
Rank  1:  wb x     ← White Bishop
          a  b
```

**Position String:**
```typescript
'x,bk/x,bb/x,bn/x,br/x,x/x,bp/wp,x/wr,x/wn,x/wb,x/wk,x:w'
```

**Implementation:**
```typescript
{
  id: 'pawn-corridors',
  name: 'Pawn Corridors',
  description: 'Promotion race - calculate tempo (7/10)',
  startPosition: 'x,bk/x,bb/x,bn/x,br/x,x/x,bp/wp,x/wr,x/wn,x/wb,x/wk,x:w',
  rationale: 'Tactical puzzle with pawns racing on narrow corridors...',
  difficulty: 'Tactical',
}
```

**Piece Analysis:**
- White: King, Bishop, Knight, Rook, Pawn (a7)
- Black: King, Bishop, Knight, Rook, Pawn (b4)
- **Total:** 10 pieces, 10 empty squares

**Tactical Themes:**
- Pawn race calculations
- Tempo and initiative
- Piece interference tactics
- Promotion threats

---

### Mode 9: Bishop Duel (2×10)

**ID:** `bishop-duel`
**Board:** 2 files (a-b) × 10 ranks
**Difficulty:** ⭐⭐⭐⭐ Advanced
**Solo Play Rating:** 8/10
**Type:** Strategic Endgame

**Starting Position:**
```
Rank 10:  x  bk    ← Black King
Rank  9:  x  bb    ← Black Bishop
Rank  8:  x  x
Rank  7:  x  br    ← Black Rook
Rank  6:  x  x
Rank  5:  x  x
Rank  4:  wr x     ← White Rook
Rank  3:  x  x
Rank  2:  wb x     ← White Bishop
Rank  1:  wk x     ← White King
          a  b
```

**Position String:**
```typescript
'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,x:w'
```

**Implementation:**
```typescript
{
  id: 'bishop-duel',
  name: 'Bishop Duel',
  description: 'Opposite-color bishops - fortress warfare (8/10)',
  startPosition: 'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,x:w',
  rationale: 'Strategic endgame featuring opposite-color bishops...',
  difficulty: 'Strategic',
}
```

**Piece Analysis:**
- White: King, Bishop, Rook
- Black: King, Bishop, Rook
- **Total:** 6 pieces, 14 empty squares
- **Key:** Bishops on opposite color squares

**Tactical Themes:**
- Opposite-color bishop endgames
- Fortress building
- Zugzwang patterns
- Color-complex strategy

---

### Mode 10: Flip-Fork (2×10)

**ID:** `flip-fork`
**Board:** 2 files (a-b) × 10 ranks
**Difficulty:** ⭐⭐⭐ Intermediate
**Solo Play Rating:** 8/10
**Type:** Tactical Puzzle

**Starting Position:**
```
Rank 10:  x  bk    ← Black King
Rank  9:  x  bb    ← Black Bishop
Rank  8:  x  x
Rank  7:  x  br    ← Black Rook
Rank  6:  x  x
Rank  5:  x  x
Rank  4:  wr x     ← White Rook
Rank  3:  x  x
Rank  2:  wb x     ← White Bishop
Rank  1:  wk wn    ← White King, Knight (unusual!)
          a  b
```

**Position String:**
```typescript
'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,wn:w'
```

**Implementation:**
```typescript
{
  id: 'flip-fork',
  name: 'Flip-Fork',
  description: 'Knight fork tactics (8/10)',
  startPosition: 'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,wn:w',
  rationale: 'White knight starts at b1 (Black\'s side)...',
  difficulty: 'Puzzle',
}
```

**Piece Analysis:**
- White: King, Bishop, Rook, Knight (b1)
- Black: King, Bishop, Rook
- **Total:** 7 pieces, 13 empty squares
- **Unusual:** White knight on Black's side of board!

**Tactical Themes:**
- Knight fork patterns
- Double attacks
- Exploiting unusual positions
- Knight mobility in cramped spaces

---

### Mode 11: Three-File Showdown (3×8)

**ID:** `three-file-showdown`
**Board:** 3 files (a-c) × 8 ranks
**Difficulty:** ⭐⭐⭐⭐ Advanced
**Solo Play Rating:** 8/10
**Type:** Strategic/Tactical Hybrid

**Starting Position:**
```
Rank 8:  bk x  x     ← Black King
Rank 7:  x  br x     ← Black Rook
Rank 6:  x  x  bn    ← Black Knight
Rank 5:  x  x  x
Rank 4:  x  x  x
Rank 3:  x  x  x
Rank 2:  wq x  x     ← White Queen
Rank 1:  wk x  x     ← White King
         a  b  c
```

**Position String:**
```typescript
'wk,x,x/wq,x,x/x,x,x/x,x,x/x,x,x/x,x,bn/x,br,x/bk,x,x:w'
```

**Implementation:**
```typescript
{
  id: 'three-file-showdown',
  name: 'Three-File Showdown',
  description: 'Queen vs Rook & Knight on 3×8 board (8/10)',
  startPosition: 'wk,x,x/wq,x,x/x,x,x/x,x,x/x,x,x/x,x,bn/x,br,x/bk,x,x:w',
  rationale: 'Power vs. numbers on wider 3-file board...',
  difficulty: 'Strategic',
  boardWidth: 3,
  boardLength: 8,
}
```

**Piece Analysis:**
- White: King, Queen
- Black: King, Rook, Knight
- **Total:** 5 pieces, 19 empty squares
- **Board:** First mode with 3 files!

**Tactical Themes:**
- Queen diagonal tactics
- Power vs numbers imbalance
- Multi-file coordination
- Cross-file maneuvers
- Diagonal pins and skewers

---

## Implementation Details

### Code Structure

All modes are defined in `src/engine.ts`:

```typescript
// 1-D Chess modes (5 total)
export const THIN_MODE_PACK: ThinMode[] = [ /* 5 modes */ ];

// Thin Chess modes (6 total)
export const SKINNY_MODE_PACK: SkinnyMode[] = [ /* 6 modes */ ];

// Help content for all 11 modes
export const MODE_HELP_CONTENT: Record<string, ModeHelp> = { /* 11 entries */ };
```

### Mode Data Structures

**1-D Chess Mode:**
```typescript
interface ThinMode {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Short description with rating
  startPosition: string;   // Position encoding
  boardLength: number;     // Board size (6-12)
  rationale: string;       // Why this mode is interesting
  difficulty: 'Puzzle' | 'Classic' | 'Strategic' | 'Asymmetric';
}
```

**Thin Chess Mode:**
```typescript
interface SkinnyMode {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Short description with rating
  startPosition: string;   // Position encoding
  rationale: string;       // Why this mode is interesting
  difficulty: 'Baseline' | 'Tactical' | 'Strategic' | 'Endgame' | 'Puzzle';
  boardWidth?: number;     // Optional (default 2)
  boardLength?: number;    // Optional (default 10)
}
```

**Help Content:**
```typescript
interface ModeHelp {
  challenge: string;                    // Full description
  solvabilityType: string;              // FORCED_WIN_WHITE | TACTICAL_PUZZLE | etc
  hints: string[];                      // Progressive hints
  solution?: string;                    // Full solution
  strategy?: {                          // For competitive modes
    whitePlan: string;
    blackPlan: string;
    keyPositions: string;
  };
  learningObjectives: string[];         // What players learn
  difficultyStars: 1 | 2 | 3 | 4 | 5;  // Star rating
  icon: string;                         // Emoji icon
}
```

### Position Encoding Format

**1-D Chess (comma-separated):**
```
"piece,piece,piece,...:side"
Example: "wk,wn,x,x,bn,bk:w"
```

**Thin Chess (ranks separated by /):**
```
"c1,c2,c3/.../c1,c2,c3:side"
Example: "wk,x/wq,x/x,x/bk,x:w"
```

**Piece Codes:**
- `x` = empty square
- `wk`/`bk` = white/black king
- `wr`/`br` = white/black rook
- `wn`/`bn` = white/black knight
- `wb`/`bb` = white/black bishop
- `wp`/`bp` = white/black pawn
- `wq`/`bq` = white/black queen

**Side Codes:**
- `:w` = white to move
- `:b` = black to move

### Board Indexing

**1-D Chess:** Linear array, index 0 = top rank
```
Index 0  → Rank N (top)
Index 1  → Rank N-1
...
Index N-1 → Rank 1 (bottom)
```

**Thin Chess:** Row-major indexing
```
Index = rank × width + file
Example (2×10): position a5 = (4 × 2) + 0 = index 8
```

---

## Adding Custom Modes

See [DEVELOPER.md](DEVELOPER.md#adding-a-new-game-mode-step-by-step-guide) for complete step-by-step guide.

### Quick Checklist

1. ✅ Design board dimensions and piece setup
2. ✅ Create position string in correct format
3. ✅ Add to `THIN_MODE_PACK` or `SKINNY_MODE_PACK`
4. ✅ Add help content to `MODE_HELP_CONTENT`
5. ✅ Run `npm run build` to verify
6. ✅ Test in-app (board renders, pieces correct, hints work)
7. ✅ Document in this file

### Supported Configurations

**1-D Chess:**
- Board lengths: 3-20 (proven: 6, 7, 8, 9, 12)
- Pieces: k, r, n (q, b, p technically supported)

**Thin Chess:**
- Board widths: 2-5 (proven: 2, 3)
- Board heights: 6-12 (proven: 8, 10)
- Pieces: k, r, n, b, p, q (all supported)

---

## Mode Statistics

**Total Modes:** 11 (5 1-D Chess + 6 Thin Chess)

**By Difficulty:**
- ⭐ Beginner: 1 mode
- ⭐⭐ Puzzle: 1 mode
- ⭐⭐⭐ Intermediate: 5 modes
- ⭐⭐⭐⭐ Advanced: 4 modes

**By Type:**
- Puzzles: 4 modes
- Strategic Battles: 3 modes
- Asymmetric Challenges: 2 modes
- Classic Setups: 2 modes

**By Board Size:**
- 1×6: 1 mode
- 1×7: 1 mode
- 1×8: 1 mode
- 1×9: 1 mode
- 1×12: 1 mode
- 2×10: 5 modes
- 3×8: 1 mode

**Solo Play Ratings:**
- 6/10: 1 mode
- 7/10: 3 modes
- 8/10: 5 modes
- 9/10: 1 mode
- N/A: 1 mode (original)

---

*For player-facing documentation, see [THIN_CHESS_MODES.md](THIN_CHESS_MODES.md)*
