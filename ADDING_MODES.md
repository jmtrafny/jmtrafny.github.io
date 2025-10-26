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
  "startPosition": "wk,wn,wr,x,x,br,bn,bk:w",
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
  }
}
```

---

## 4) Position encoding
### 1‑D Chess (`variant: "1xN"` — **1×N**)
- Comma‑separated top→bottom, then `:w` or `:b`.
- Example (1×8): `wk,wn,wr,x,x,br,bn,bk:w`

### Thin Chess (`variant: "NxM"` — **M×N**)
- Ranks separated by `/`, each rank has `M` comma‑separated cells; then `:w` or `:b`.
- Example (2×8): `x,bk/x,bb/x,x/x,x/wk,x/wr,x/x,x:w`

**Piece tokens:** `x` empty; `k/r/n/b/p/q` with side prefix `w` or `b` (e.g., `wk`, `br`).

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
