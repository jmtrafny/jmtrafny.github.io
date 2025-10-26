# Game Modes Reference

Complete technical reference for all game modes configured in `public/game-modes.json`.

## Table of Contents
1. [Overview](#overview)
2. [1-D Chess Modes](#1-d-chess-modes) (3 modes)
3. [Thin Chess Modes](#thin-chess-modes) (3 modes)
4. [Mini-Board Puzzles](#mini-board-puzzles) (6 puzzles)
5. [Implementation Details](#implementation-details)
6. [Adding Custom Modes](#adding-custom-modes)

---

## Overview

**Total Modes:** 12 (3 1-D Chess + 3 Thin Chess + 6 Mini-Board Puzzles)
**Configuration File:** `public/game-modes.json` (version 2.0.0)
**Architecture:** JSON-based configuration loaded at runtime

All game modes are defined in the JSON configuration file and loaded dynamically. No code changes are required to add new modes - simply edit the JSON file.

---

## 1-D Chess Modes

Single-file chess played on a linear board (1 × N squares). Uses the "thin" variant engine with perfect-play AI solver.

### Mode 1: 1-D Chess: Full Set (1×12)

**ID:** `1D12_CLASSIC`
**Board:** 1 file × 12 ranks
**Difficulty:** ⭐⭐⭐ Intermediate
**Category:** `1d-chess`

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
```
bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w
```

**Piece Analysis:**
- White: King, 2 Rooks, 2 Knights
- Black: King, 2 Rooks, 2 Knights
- **Total:** 10 pieces, 2 empty squares

**Tactical Themes:**
- Multi-piece coordination in 1D
- Rook and knight synergy
- Central square control (positions 5-7)
- Strategic planning and endgame transitions

---

### Mode 2: Twin Knights Siege (1×10)

**ID:** `1D10_TWIN_KNIGHTS`
**Board:** 1 file × 10 ranks
**Difficulty:** ⭐⭐ Intermediate
**Category:** `1d-chess`

**Starting Position:**
```
10  bk    ← Black King
 9  br    ← Black Rook
 8  bn    ← Black Knight
 7  bn    ← Black Knight
 6  x     ← Empty
 5  x     ← Empty
 4  wn    ← White Knight
 3  wn    ← White Knight
 2  wr    ← White Rook
 1  wk    ← White King
```

**Position String:**
```
bk,br,bn,bn,x,x,wn,wn,wr,wk:w
```

**Piece Analysis:**
- White: King, Rook, 2 Knights
- Black: King, Rook, 2 Knights
- **Total:** 8 pieces, 2 empty squares

**Tactical Themes:**
- Double-knight tactics
- Tempo and timing
- Knight ±2 jump mechanics
- First-move advantage

---

### Mode 3: Monk 1-D Chess (1×8)

**ID:** `1D8_MONK`
**Board:** 1 file × 8 ranks
**Difficulty:** ⭐⭐⭐⭐ Advanced
**Category:** `1d-chess`

**Starting Position:**
```
 8  bk    ← Black King
 7  bn    ← Black Knight
 6  br    ← Black Rook
 5  x     ← Empty
 4  x     ← Empty
 3  wr    ← White Rook
 2  wn    ← White Knight
 1  wk    ← White King
```

**Position String:**
```
wk,wn,wr,x,x,br,bn,bk:w
```

**Piece Analysis:**
- White: King, Rook, Knight
- Black: King, Rook, Knight
- **Total:** 6 pieces, 2 empty squares

**Tactical Themes:**
- Classic Martin Gardner 1-D Chess position
- K+R+N coordination in constrained space
- Tempo checks to drive the king
- Mating net construction
- Proven: White has forced win with perfect play

---

## Thin Chess Modes

Narrow-board chess variants played on 2-3 files. Uses the "skinny" variant engine with random-move AI.

### Mode 4: Knight's Trench (2×8)

**ID:** `2X8_KNIGHTS_TRENCH`
**Board:** 2 files (a-b) × 8 ranks
**Difficulty:** ⭐⭐⭐ Beginner
**Category:** `thin-chess`

**Starting Position:**
```
Rank 8:  bn bk    ← Black Knight, King
Rank 7:  bp x     ← Black Pawn
Rank 6:  x  bp    ← Black Pawn
Rank 5:  x  x
Rank 4:  x  x
Rank 3:  x  x
Rank 2:  x  x
Rank 1:  wp x     ← White Pawn
         a  b
```

**Position String:**
```
bn,bk/bp,x/x,bp/x,x/x,x/x,x/wp,x/wn,wk:w
```

**Piece Analysis:**
- White: King, Knight, 1 Pawn
- Black: King, Knight, 2 Pawns
- **Total:** 6 pieces, 10 empty squares

**Tactical Themes:**
- Trench warfare with pawn blockades
- Knight maneuvering in confined space
- Pawn promotion races
- Piece development

---

### Mode 5: Bishop vs Knight Showdown (2×7)

**ID:** `2X7_BISHOP_VS_KNIGHT`
**Board:** 2 files (a-b) × 7 ranks
**Difficulty:** ⭐⭐⭐ Intermediate
**Category:** `thin-chess`

**Starting Position:**
```
Rank 7:  bk br    ← Black King, Rook
Rank 6:  x  bb    ← Black Bishop
Rank 5:  x  x
Rank 4:  x  x
Rank 3:  wn x     ← White Knight
Rank 2:  wr wk    ← White Rook, King
Rank 1:  x  x
         a  b
```

**Position String:**
```
bk,br/x,bb/x,x/x,x/wn,x/wr,wk:w
```

**Piece Analysis:**
- White: King, Rook, Knight
- Black: King, Rook, Bishop
- **Total:** 6 pieces, 8 empty squares

**Tactical Themes:**
- Asymmetric piece values (bishop vs knight)
- Adapting tactics to piece types
- Color-square control (bishop)
- Knight fork patterns

---

### Mode 6: Compact Battle (3×6)

**ID:** `3X6_COMPACT_BATTLE`
**Board:** 3 files (a-c) × 6 ranks
**Difficulty:** ⭐⭐⭐⭐ Advanced
**Category:** `thin-chess`

**Starting Position:**
```
Rank 6:  br bk bn   ← Black Rook, King, Knight
Rank 5:  x  bb x    ← Black Bishop
Rank 4:  x  x  x
Rank 3:  wp wn x    ← White Pawn, Knight
Rank 2:  wp x  x    ← White Pawn
Rank 1:  wr wk wb   ← White Rook, King, Bishop
         a  b  c
```

**Position String:**
```
br,bk,bn/x,bb,x/x,x,x/wp,wn,x/wp,x,x/wr,wk,wb:w
```

**Piece Analysis:**
- White: King, Rook, Bishop, Knight, 2 Pawns
- Black: King, Rook, Bishop, Knight
- **Total:** 10 pieces, 8 empty squares
- **Board:** First mode with 3 files!

**Tactical Themes:**
- Three-file warfare
- Opposite-color bishops
- Fortress building
- Multi-piece coordination in compact space

---

## Mini-Board Puzzles

Tactical and endgame challenges on 1-D (1×N) and 2-D (2×N, 3×N) boards. Mixed variant engines.

### Puzzle 1: Top-Rank Guillotine (2×6)

**ID:** `2X6_TOP_RANK_GUILLOTINE`
**Difficulty:** ⭐ Beginner
**Category:** `mini-puzzles`
**Board:** 2×6
**Variant:** skinny

**Position:** `x,bk/x,x/x,x/wk,x/wr,x/x,x:w`

**Challenge:** Fundamental K+R vs K ladder mate. Perfect for rook ladder training.

**Learning Objectives:**
- Execute K+R vs K checkmate
- Rook ladder technique
- King opposition and zugzwang

---

### Puzzle 2: Top-Rank Guillotine (2×8)

**ID:** `2X8_TOP_RANK_GUILLOTINE`
**Difficulty:** ⭐⭐⭐ Beginner
**Category:** `mini-puzzles`
**Board:** 2×8
**Variant:** skinny

**Position:** `x,bk/x,x/x,x/x,x/wk,x/wr,x/x,x:w`

**Challenge:** Extended version of rook ladder sequence. Slightly deeper than 2×6.

**Learning Objectives:**
- Power vs numbers material imbalance
- Leveraging superior piece range
- Knight fork defense tactics
- Piece cooperation under pressure

---

### Puzzle 3: Bishop Corridor Squeeze (2×8)

**ID:** `2X8_BISHOP_CORRIDOR_SQUEEZE`
**Difficulty:** ⭐⭐⭐ Intermediate
**Category:** `mini-puzzles`
**Board:** 2×8
**Variant:** skinny

**Position:** `x,bk/x,bb/x,x/x,x/wk,x/wr,x/x,x:w`

**Challenge:** A test of zugzwang entry and bishop maneuvering through fortress setups.

**Learning Objectives:**
- Knight fork tactical patterns
- Forcing sequences with knights
- Maximizing knight reach on narrow boards
- Knights excelling when lines are blocked

---

### Puzzle 4: Flip-Fork Lite (2×8)

**ID:** `2X8_FLIP_FORK_LITE`
**Difficulty:** ⭐⭐⭐ Intermediate
**Category:** `mini-puzzles`
**Board:** 2×8
**Variant:** skinny

**Position:** `x,bk/x,bb/x,x/x,br/x,x/wr,x/x,x/wk,wn:w`

**Challenge:** Knight fork setup in a tight space. Fast tactical drill.

**Learning Objectives:**
- Two-knight coordination
- Asymmetric material handling
- Mobility vs power trade-offs
- Rook's need for open lines

---

### Puzzle 5: Three-File Showdown (3×8)

**ID:** `3X8_THREE_FILE_SHOWDOWN`
**Difficulty:** ⭐⭐⭐⭐ Advanced
**Category:** `mini-puzzles`
**Board:** 3×8
**Variant:** skinny

**Position:** `wk,x,x/wq,x,x/x,x,x/x,x,x/x,x,x/x,x,bn/x,br,bp/bk,x,x:b`

**Challenge:** Power vs numbers on a slightly broader battlefield. Queen tactics dominate.

**Learning Objectives:**
- Queen power on wider narrow boards
- Diagonal tactics (pins, skewers, forks)
- Multi-piece coordination against superior force
- Multi-piece cooperation patterns

---

### Puzzle 6: Rook Race (1×9)

**ID:** `1X9_ROOK_RACE`
**Difficulty:** ⭐ Intermediate
**Category:** `mini-puzzles`
**Board:** 1×9
**Variant:** thin

**Position:** `wk,wr,x,x,x,x,bn,br,bk:w`

**Challenge:** A compressed power vs numbers battle. Knight fork threat at the center.

**Learning Objectives:**
- Rook laddering
- Opposition
- Edge mates

---

## Implementation Details

### Configuration Architecture

All modes are loaded from `public/game-modes.json` at runtime using the configuration loader system.

**Key Files:**
- `public/game-modes.json` - Mode definitions and metadata
- `src/config/loader.ts` - Configuration loading and caching
- `src/config/validator.ts` - Runtime validation
- `src/config/GameModeConfig.ts` - TypeScript interfaces
- `src/hooks/useGameModes.ts` - React hook for accessing modes

### JSON Structure

```json
{
  "version": "2.0.0",
  "categories": [
    {
      "id": "category-id",
      "name": "Display Name",
      "description": "Description",
      "variant": "thin" | "skinny" | "mixed",
      "icon": "🎮"
    }
  ],
  "modes": [
    {
      "id": "MODE_ID",
      "categoryId": "category-id",
      "name": "Mode Name",
      "description": "Short description",
      "variant": "thin" | "skinny",
      "boardWidth": 1-3,
      "boardHeight": 6-12,
      "startPosition": "encoded-position",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "difficultyStars": 1-5,
      "icon": "🎯",
      "help": {
        "challenge": "Full description",
        "solvabilityType": "FORCED_WIN_WHITE" | "COMPETITIVE" | etc,
        "hints": ["hint1", "hint2"],
        "solution": "solution text or null",
        "strategy": { /* strategy object or null */ },
        "learningObjectives": ["objective1", "objective2"]
      }
    }
  ]
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

### Quick Steps

1. ✅ Open `public/game-modes.json`
2. ✅ Add your mode to the `modes` array
3. ✅ Ensure `categoryId` matches an existing category
4. ✅ Create valid position string
5. ✅ Add help content with hints and learning objectives
6. ✅ (Optional) Update `defaultGame` to set your mode as default
7. ✅ Run `npm run build` to verify
8. ✅ Test in-app

**No code changes required!** The UI will automatically pick up new modes.

### Configuring Default Game

The `defaultGame` field (optional) controls which game loads on app startup:

```json
{
  "version": "2.0.0",
  "defaultGame": {
    "modeId": "1D12_CHESSTRAPS",
    "gameType": "1player",
    "playerSide": "w"
  },
  "categories": [...]
}
```

- **modeId**: Must match a valid mode ID from the `modes` array
- **gameType**: Either `"1player"` or `"2player"`
- **playerSide**: Either `"w"` (white) or `"b"` (black) - only used in 1-player mode

If omitted, the app will load the first mode in the configuration.

### Validation

The configuration is validated at load time. Common errors:
- Missing required fields
- Invalid `categoryId` references
- Malformed position strings
- Invalid difficulty values

See `src/config/validator.ts` for full validation rules.

### Supported Configurations

**1-D Chess (variant: "thin"):**
- Board widths: 1 (always)
- Board heights: 6-12 (tested)
- Pieces: k, r, n, (q, b, p supported but untested)
- AI: Perfect-play solver

**Thin Chess (variant: "skinny"):**
- Board widths: 2-3 (tested)
- Board heights: 6-10 (tested)
- Pieces: k, r, n, b, p, q (all supported)
- AI: Random move selection

---

## Mode Statistics

**Total Modes:** 12

**By Category:**
- 1-D Chess: 3 modes
- Thin Chess: 3 modes
- Mini-Board Puzzles: 6 modes

**By Difficulty:**
- ⭐ Beginner: 2 modes
- ⭐⭐ Intermediate: 1 mode
- ⭐⭐⭐ Beginner/Intermediate: 5 modes
- ⭐⭐⭐⭐ Advanced: 4 modes

**By Board Size:**
- 1×8: 1 mode
- 1×9: 1 mode
- 1×10: 1 mode
- 1×12: 1 mode
- 2×6: 1 mode
- 2×7: 1 mode
- 2×8: 4 modes
- 3×6: 1 mode
- 3×8: 1 mode

**By Variant:**
- thin (1-D Chess): 4 modes
- skinny (Thin Chess): 8 modes

---

*For player-facing documentation, see [THIN_CHESS_MODES.md](THIN_CHESS_MODES.md)*
