# ADDING_MODES.md
Short, practical guide for adding or tweaking game modes in Thin Chess.

---

## 1) Where modes live
- **File:** `public/game-modes.json`
- **What:** All categories, modes, and (now) the optional `defaultGame` that controls the startup selection.
- **No code changes needed:** Edit the JSON and reload the app.

---

## 2) Configuring a default game (new)
If present, the app will load this on startup:

```json
{
  "defaultGame": {
    "modeId": "1D8_MONK",
    "gameType": "1player",
    "playerSide": "w"
  }
}
```

**Rules:**
- `modeId` must match an existing mode in the `modes` array.
- `gameType`: `"1player"` or `"2player"`.
- `playerSide`: `"w"` or `"b"` (used only in 1‑player mode).
- If `defaultGame` is omitted, the app falls back to the first configured mode.

**Tip:** Set this to any mode you want to showcase by default (e.g., a featured puzzle).

---

## 3) Categories and modes — minimal schema
**Category:**
```json
{
  "id": "1d-chess",
  "name": "1-D Chess",
  "description": "Single-file chess on a line",
  "icon": "♟️"
}
```

**Mode (minimal):**
```json
{
  "id": "MY_MODE_ID",
  "categoryId": "1d-chess",
  "name": "Display Name",
  "description": "Short description",
  "variant": "1xN",             // '1xN' (1-D) or 'NxM' (2–3 files)
  "boardWidth": 1,
  "boardHeight": 8,
  "startPosition": "bk,bn,br,x,x,wr,wn,wk:w",
  "difficulty": "Intermediate", // Beginner | Intermediate | Advanced
  "difficultyStars": 3,         // 1–5
  "icon": "🎯",
  "help": {
    "challenge": "One-liner or paragraph",
    "solvabilityType": "COMPETITIVE",     // e.g., FORCED_WIN_WHITE | COMPETITIVE | TACTICAL_PUZZLE | DRAWISH
    "hints": ["Hint 1", "Hint 2"],
    "solution": null,
    "strategy": {
      "whitePlan": "Optional",
      "blackPlan": "Optional",
      "keyPositions": "Optional"
    },
    "learningObjectives": ["Optional list"]
  },
  "rules": {                    // Optional: custom rule flags (see §3a)
    "castling": false,
    "enPassant": false,
    "fiftyMoveRule": false,
    "threefold": false,
    "promotion": false
  }
}
```

---

## 3a) Rule Flags (New)

You can optionally specify a `rules` object to enable/disable specific chess rules for a mode.

**Available Flags:**

```json
{
  "rules": {
    "castling": false,          // true = castling enabled (not fully implemented yet)
    "enPassant": true,          // true = en passant captures allowed
    "fiftyMoveRule": true,      // true = draw after 100 plies without capture/pawn move
    "threefold": true,          // true = draw on 3rd position repetition
    "promotion": true,          // true = pawns promote to Q/R/B/N; false = freeze on last rank
    "aiStrategy": "perfect"     // "perfect" | "aggressive" | "cooperative"
  }
}
```

**Default Behavior:** If `rules` is omitted, all flags default to `false` (or `"perfect"` for `aiStrategy`).

**Rule Details:**

- **`promotion`**: When `true`, generates 4 promotion moves (Q/R/B/N) on last rank. When `false`, pawn can move to last rank but stays frozen (no further moves).

- **`enPassant`**: When `true`, pawns can capture en passant after opponent's double-step. When `false`, no en passant captures.

- **`fiftyMoveRule`**: When `true`, game is drawn after 100 plies (50 full moves) with no captures or pawn moves. Automatically resets on captures/pawn moves.

- **`threefold`**: When `true`, game is drawn when the same position (board + turn + EP + castling) occurs 3 times. Position history tracked automatically.

- **`aiStrategy`**: Controls AI move selection behavior (**1×N modes only**):
  - `"perfect"`: AI plays optimally (WIN > DRAW > LOSS). Use for competitive modes.
  - `"aggressive"`: AI avoids draws (WIN > LOSS > DRAW). Keeps games dynamic.
  - `"cooperative"`: AI only wins if forced, otherwise plays randomly. Use for teaching puzzles where player should win.
  - **Note:** This flag only affects 1-D Chess (1×N) modes that use the perfect-play solver. Minichess (M×N) modes always use random move selection regardless of this setting.

- **`castling`**: Scaffolding in place but move generation not fully implemented. Keep `false` for now.

**Board-Agnostic:** All rules work on any NxM board size (1×8, 2×10, 3×5, etc.).

**Extended Position Format:** When rules are active, positions may include additional fields:
```
board:turn:ep:halfmove:castling
```
Example: `bk,bn,br,x,x,wr,wn,wk:w:-:0:0`

---

## 4) Position encoding

### Board Orientation Rules
- **Top to bottom** = **High rank to low rank** (Rank N → Rank 1)
- **Standard orientation:** Black pieces at top (high ranks), White pieces at bottom (low ranks)
- This matches how chess boards are typically shown (White at bottom)

### 1‑D Chess (`variant: "1xN"` — **1×N**)
- Comma‑separated from top→bottom (high rank to low rank), then `:w` or `:b`
- Example (1×8): `bk,bn,br,x,x,wr,wn,wk:w`
  - Top (Rank 8): Black King
  - Bottom (Rank 1): White King

### Thin Chess (`variant: "NxM"` — **M×N**)
- Ranks separated by `/` from high to low
- Each rank has `M` comma‑separated cells (left to right: file a, b, c...)
- Then `:w` or `:b` for turn
- Example (2×6): `x,bk/x,x/x,x/wk,x/wr,x/x,x:w`
  - Rank 6 (top): `x,bk` (Black King on b6)
  - Rank 1 (bottom): `x,x` (empty)

**Piece tokens:** `x` = empty; `k/r/n/b/p/q` with side prefix `w` or `b` (e.g., `wk`, `br`, `wq`).

**Variant keys:** `"1xN"` = 1‑D; `"NxM"` = 2‑3 files.

---

## 5) Quick recipe to add a mode
1. **Pick a category** (`categoryId`) or add one.
2. **Set board size** (`boardWidth`, `boardHeight`) that matches the variant.
3. **Encode the start position** per §4.
4. **Fill metadata** (difficulty/stars/icon/description).
5. **Write help** (challenge, solvabilityType, hints → solution; optional strategy; learning objectives).
6. **(Optional) Make it default** — set `"defaultGame"` to this mode’s `modeId`.
7. **Build & test**: `npm run build` → open app → select your mode → verify Help and moves.

---

## 6) Validation & QA checklist
- IDs are unique; `categoryId` exists.
- `startPosition` square count == `boardWidth × boardHeight`.
- Difficulty ∈ {Beginner, Intermediate, Advanced}; `difficultyStars` ∈ [1..5].
- Variant keys are **exactly** `"1xN"` or `"NxM"`.
- For `defaultGame` (if present): `modeId` exists; `gameType`/`playerSide` valid.
- In‑app Help shows Hint 1 → Hint 2 → Solution in order.
- Legal moves, game‑over detection, and (for thin) solver behavior look correct.

---

## 7) Common pitfalls
- ❌ Off‑by‑one in `startPosition` length vs board squares.
- ❌ Typos in variant keys (`"1xN"`/`"NxM"`) break encoders.
- ❌ `defaultGame.modeId` not found → app loads first mode instead.
- ❌ Forgetting to add learning/strategy text makes the mode feel unfinished.

---

## 8) Copy‑paste templates
### A. New 1‑D mode (1×N)
```json
{
  "id": "1D8_MY_MODE",
  "categoryId": "1d-chess",
  "name": "My 1-D Idea",
  "description": "Short pitch.",
  "variant": "1xN",
  "boardWidth": 1,
  "boardHeight": 8,
  "startPosition": "bk,br,bn,x,x,wn,wr,wk:w",
  "difficulty": "Intermediate",
  "difficultyStars": 3,
  "icon": "🎯",
  "help": {
    "challenge": "Explain the goal.",
    "solvabilityType": "COMPETITIVE",
    "hints": ["Early tactic", "Follow‑up"],
    "solution": null,
    "strategy": null,
    "learningObjectives": ["Objective A", "Objective B"]
  }
}
```

### B. New Thin Chess mode (M×N, M=2..3)
```json
{
  "id": "2X8_MY_MODE",
  "categoryId": "thin-chess",
  "name": "My 2‑File Duel",
  "description": "Short pitch.",
  "variant": "NxM",
  "boardWidth": 2,
  "boardHeight": 8,
  "startPosition": "x,bk/x,bb/x,x/x,x/wk,x/wr,x/x,x:w",
  "difficulty": "Beginner",
  "difficultyStars": 2,
  "icon": "🧩",
  "help": {
    "challenge": "Explain the goal.",
    "solvabilityType": "TACTICAL_PUZZLE",
    "hints": ["Hint 1", "Hint 2"],
    "solution": "Optional line(s) or null",
    "strategy": {
      "whitePlan": "Optional",
      "blackPlan": "Optional",
      "keyPositions": "Optional"
    },
    "learningObjectives": ["Optional"]
  }
}
```

---

## 9) Troubleshooting
- **Validation error on load:** Check IDs, variant names, and `startPosition` length.
- **Board looks wrong:** Recount ranks/files in the position string.
- **Default game didn’t load:** Verify `modeId` spelling and that the mode exists.

---

## 10) Notes
- Keep mode names succinct; descriptions are player‑facing.
- Prefer concrete learning goals; keep hint text short and progressive.
- Update `GAME_MODES.md`/player docs when you add notable modes.
