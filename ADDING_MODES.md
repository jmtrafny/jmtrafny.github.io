# Adding Your Own Game Mode

Want to create your own chess puzzle or variant? Great! This guide will walk you through it step-by-step. **No coding required** - just editing a JSON configuration file.

## What You'll Learn
- How to add a new chess position to the game
- How to configure difficulty and AI behavior
- How to write hints and solutions
- How to test your creation

## Prerequisites
- Basic text editing skills
- Understanding of chess notation (helpful but not required)
- 15-30 minutes of time

---

## Quick Start: 5 Steps to Add a Mode

1. Open `public/game-modes.json` in your text editor
2. Copy one of the example templates (see §8 below)
3. Customize the position, difficulty, and help text
4. Save the file
5. Test in your browser (`npm run dev`)

That's it! No code changes needed.

---

## 1) Where Game Modes Live

**File:** `public/game-modes.json`

This JSON file contains:
- All game categories (1-D Chess, Minichess, etc.)
- All game modes (puzzles and positions)
- The default game that loads on startup

When you edit this file and reload the app, your changes appear immediately - no build step needed for development.

---

## 2) Understanding Game Categories

Before adding a mode, you need to know which category it belongs to. Categories group similar modes together.

**Current categories:**
- `1d-chess`: Single-file chess on a vertical line
- `minichess-classics`: Small board variants (5×5, 6×6, etc.)

**To use an existing category:** Set `"categoryId": "1d-chess"` in your mode.

**To add a new category:** Add an entry to the `"categories"` array:
```json
{
  "id": "my-category",
  "name": "My Puzzles",
  "description": "Custom puzzle collection",
  "icon": "🧩"
}
```

---

## 3) Understanding Position Types (solvabilityType)

This tells players what kind of position they're playing. Choose ONE:

### `FORCED_WIN_WHITE`
White has a guaranteed winning sequence.
- **Example:** "Mate in 3" puzzle where White forces checkmate
- **AI behavior:** Should use `"aiStrategy": "cooperative"` so AI doesn't defend optimally
- **Display:** Shows "FORCED WIN WHITE" badge in help modal

### `TACTICAL_PUZZLE`
Training position with a specific tactical theme.
- **Example:** "Find the fork" or "Pin the queen"
- **AI behavior:** Use `"cooperative"` so player can find the tactic
- **Display:** Shows "TACTICAL PUZZLE" badge

### `COMPETITIVE`
Balanced position where both sides have chances.
- **Example:** Equal material, open middlegame
- **AI behavior:** Use `"competitive"` so AI plays its best moves
- **Display:** Shows "COMPETITIVE" badge

### `DRAWISH`
Position tends toward draws with perfect play.
- **Example:** Opposite-colored bishops, fortress positions
- **AI behavior:** Use `"perfect"` or `"competitive"`
- **Display:** Shows "DRAWISH" badge

**💡 Tip:** Most puzzles use `TACTICAL_PUZZLE`, most open games use `COMPETITIVE`.

---

## 4) Position Encoding Made Simple

The `startPosition` field describes where pieces start. Think of it like reading the board from **top to bottom**.

### Example 1: 1-D Chess (1×8 board)

**Visual board:**
```
Rank 8 (top)    ♚  Black King     →  bk
Rank 7          ♞  Black Knight   →  bn
Rank 6          ♜  Black Rook     →  br
Rank 5          ·  Empty          →  x
Rank 4          ·  Empty          →  x
Rank 3          ♖  White Rook     →  wr
Rank 2          ♘  White Knight   →  wn
Rank 1 (bottom) ♔  White King     →  wk
```

**Encoded as:** `"bk,bn,br,x,x,wr,wn,wk:w"`
- Pieces separated by commas
- `:w` means White to move (use `:b` for Black to move)

### Example 2: Mini Board (6×6)

**Visual board:**
```
Rank 6: ♜ ♞ ♛ ♚ ♞ ♜   →  br,bn,bq,bk,bn,br
Rank 5: ♟ ♟ ♟ ♟ ♟ ♟   →  bp,bp,bp,bp,bp,bp
Rank 4: · · · · · ·   →  x,x,x,x,x,x
Rank 3: · · · · · ·   →  x,x,x,x,x,x
Rank 2: ♙ ♙ ♙ ♙ ♙ ♙   →  wp,wp,wp,wp,wp,wp
Rank 1: ♖ ♘ ♕ ♔ ♘ ♖   →  wr,wn,wq,wk,wn,wr
```

**Encoded as:** `"br,bn,bq,bk,bn,br/bp,bp,bp,bp,bp,bp/x,x,x,x,x,x/x,x,x,x,x,x/wp,wp,wp,wp,wp,wp/wr,wn,wq,wk,wn,wr:w"`
- Each rank separated by `/`
- Within each rank, pieces separated by commas
- Still reads **top to bottom** (high rank to low rank)

### Piece Codes Reference

| Piece | White | Black |
|-------|-------|-------|
| King | `wk` | `bk` |
| Queen | `wq` | `bq` |
| Rook | `wr` | `br` |
| Bishop | `wb` | `bb` |
| Knight | `wn` | `bn` |
| Pawn | `wp` | `bp` |
| Empty | `x` | `x` |

**💡 Tip:** Count your pieces! Total must equal `boardWidth × boardHeight`.

---

## 5) AI Behavior (aiStrategy)

Controls how the AI plays against you:

### `"competitive"` (recommended for most modes)
AI plays to win with smart moves.
- **Best for:** Challenging games, balanced positions
- **Behavior:** Finds tactics, defends properly, seeks checkmate
- **Example use:** 6×6 Los Alamos, 5×5 Gardner

### `"cooperative"`
AI helps you win by making mistakes.
- **Best for:** Puzzles where player should win
- **Behavior:** Only defends if winning, otherwise plays randomly
- **Example use:** "Mate in 3" puzzles, tactical training

### `"perfect"`
AI never makes mistakes.
- **Best for:** Teaching optimal defense
- **Behavior:** Finds absolute best move every time
- **Example use:** Learning endgame technique

**Example configuration:**
```json
"rules": {
  "aiStrategy": "cooperative",  // For a puzzle
  "promotion": false
}
```

**💡 Note:** On complex boards (20+ pieces), the AI uses evaluation-based search instead of perfect solving, but still follows the strategy you choose.

---

## 6) Rule Flags Explained

You can enable/disable specific chess rules for any mode:

```json
"rules": {
  "castling": false,          // Castling allowed? (not fully implemented)
  "enPassant": true,          // En passant captures allowed?
  "fiftyMoveRule": true,      // Draw after 100 plies without capture/pawn move?
  "threefold": true,          // Draw on 3rd position repetition?
  "promotion": true,          // Pawns promote to Q/R/B/N? (false = freeze on last rank)
  "pawnTwoMove": true,        // Pawns can move 2 squares on first move? (default: true)
  "aiStrategy": "competitive" // "perfect" | "competitive" | "cooperative"
}
```

**Default:** All flags are `false` if you omit the `rules` section, except:
- `pawnTwoMove` defaults to `true`
- `aiStrategy` defaults to `'perfect'`

**Most common setup:**
```json
"rules": {
  "aiStrategy": "competitive",
  "promotion": true,
  "enPassant": false,
  "fiftyMoveRule": false,
  "threefold": false,
  "castling": false,
  "pawnTwoMove": true
}
```

### Pawn Movement Rules

- **`pawnTwoMove: true`** (default): Pawns can move 2 squares forward on their first move
  - **Use for:** Standard chess rules, most variants
  - **Note:** Pawns track whether they've moved, so this works correctly even with custom positions

- **`pawnTwoMove: false`**: Pawns can ONLY move 1 square at a time
  - **Use for:** Slow-paced variants, educational modes where double-moves add complexity
  - **Example:** "One Step Chess" where all pieces move more deliberately

**Example (disable pawn double-moves):**
```json
"rules": {
  "pawnTwoMove": false,
  "aiStrategy": "competitive"
}
```

### Win Condition Flags

Choose alternative victory conditions:

- **`materialCountWin: true`**: When no legal moves remain, whoever has the most pieces wins (not stalemate)
  - **Use for:** "Last piece standing" variants
  - **Example:** Material race modes where piece count matters

- **`raceToBackRank: true`**: First to get ANY piece to opposite back rank wins immediately
  - **Use for:** Racing/breakthrough variants
  - **Example:** Pawn race modes, piece advancement challenges
  - **Note:** White wins by reaching rank 0 (top), Black wins by reaching bottom rank

**Example:**
```json
"rules": {
  "materialCountWin": true,
  "aiStrategy": "competitive"
}
```

---

## 7) Testing Your Mode

### Step-by-Step Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:5173`

2. **Open your browser:**
   - Go to `http://localhost:5173`
   - Click "New Game" button
   - Find your category in the list
   - Click your new mode

3. **Verify the board (Visual Check):**
   - ✅ All pieces in correct positions?
   - ✅ Correct number of pieces?
   - ✅ Board dimensions match your configuration?
   - ✅ Piece colors correct (White on bottom, Black on top)?

4. **Test gameplay:**
   - ✅ Can you move pieces legally?
   - ✅ Illegal moves rejected?
   - ✅ Does the AI respond within a few seconds?
   - ✅ Does the game end correctly (checkmate/stalemate)?
   - ✅ Sound effects play (move/capture)?

5. **Check the Help modal:**
   - Click the "?" button in top-right
   - ✅ Challenge description appears?
   - ✅ solvabilityType badge shows correctly?
   - ✅ Hints reveal in order (Hint 1 → Hint 2 → Solution)?
   - ✅ Learning objectives listed?

6. **Test edge cases:**
   - Try undo/redo buttons
   - Try resigning
   - Try starting a new game
   - Refresh the page (should remember settings)

### Common Errors and Fixes

#### ❌ "Failed to load configuration"
**Cause:** JSON syntax error (missing comma, bracket, quote)

**Fix:**
1. Use a JSON validator: https://jsonlint.com
2. Copy your `game-modes.json` content
3. Paste and click "Validate"
4. Fix any errors shown

#### ❌ "Invalid solvabilityType: XYZ"
**Cause:** Typo in solvabilityType field

**Fix:** Use exactly one of these:
- `FORCED_WIN_WHITE`
- `TACTICAL_PUZZLE`
- `COMPETITIVE`
- `DRAWISH`

#### ❌ Board looks scrambled
**Cause:** Wrong piece count or incorrect encoding

**Fix:**
1. Count pieces in your startPosition
2. Verify count equals `boardWidth × boardHeight`
3. For NxM boards, check `/` separators between ranks
4. Make sure you're reading top-to-bottom

#### ❌ "Mode doesn't appear in list"
**Cause:** Invalid `categoryId`

**Fix:**
- Verify `categoryId` matches an existing category's `id`
- Check spelling exactly (case-sensitive)

#### ❌ AI doesn't move
**Cause:** Error in position or rules

**Fix:**
1. Open browser console (F12 → Console tab)
2. Look for red error messages
3. Check that `variant` matches board size:
   - `"1xN"` for single-file boards
   - `"NxM"` for 2+ file boards

---

## 8) Complete Examples (Copy-Paste Ready)

### Example 1: Simple Mate-in-2 Puzzle (1×8)

Perfect for beginners to understand the structure.

```json
{
  "id": "MY_MATE_IN_2",
  "categoryId": "1d-chess",
  "name": "Mate in 2 Challenge",
  "description": "White to play and mate in 2 moves",
  "variant": "1xN",
  "boardWidth": 1,
  "boardHeight": 8,
  "startPosition": "bk,x,x,x,wq,x,wr,wk:w",
  "difficulty": "Beginner",
  "difficultyStars": 2,
  "icon": "🎯",
  "help": {
    "challenge": "Find the forced checkmate sequence for White.",
    "solvabilityType": "TACTICAL_PUZZLE",
    "hints": [
      "The queen and rook can coordinate for mate",
      "Push the black king to the edge first"
    ],
    "solution": "1. Qd4+ Ka5 2. Ra7#",
    "strategy": null,
    "learningObjectives": [
      "Queen and rook coordination",
      "Edge checkmate patterns"
    ]
  },
  "rules": {
    "castling": false,
    "enPassant": false,
    "fiftyMoveRule": false,
    "threefold": false,
    "promotion": false,
    "aiStrategy": "cooperative"
  }
}
```

### Example 2: Balanced 6×6 Game

Shows how to set up a competitive minichess game.

```json
{
  "id": "MY_6X6_GAME",
  "categoryId": "minichess-classics",
  "name": "My 6×6 Variant",
  "description": "Custom 6×6 starting position",
  "variant": "NxM",
  "boardWidth": 6,
  "boardHeight": 6,
  "startPosition": "br,bn,bq,bk,bn,br/bp,bp,bp,bp,bp,bp/x,x,x,x,x,x/x,x,x,x,x,x/wp,wp,wp,wp,wp,wp/wr,wn,wq,wk,wn,wr:w",
  "difficulty": "Intermediate",
  "difficultyStars": 3,
  "icon": "♟️",
  "help": {
    "challenge": "Play a competitive 6×6 game with standard piece setup",
    "solvabilityType": "COMPETITIVE",
    "hints": [
      "Control the center early",
      "Develop knights before bishops on small boards"
    ],
    "solution": null,
    "strategy": {
      "whitePlan": "Occupy center with pawns, develop pieces quickly",
      "blackPlan": "Counter-attack on flanks after White commits center",
      "keyPositions": "Central files decide the game"
    },
    "learningObjectives": [
      "Minichess strategy",
      "Fast development",
      "Center control on small boards"
    ]
  },
  "rules": {
    "castling": false,
    "enPassant": false,
    "fiftyMoveRule": false,
    "threefold": false,
    "promotion": true,
    "aiStrategy": "competitive"
  }
}
```

---

## 9) Configuration Reference

### Required Fields

Every game mode must have these fields:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"MY_MODE"` | Unique identifier (UPPERCASE_WITH_UNDERSCORES) |
| `categoryId` | string | `"1d-chess"` | Must match existing category |
| `name` | string | `"My Puzzle"` | Display name shown to players |
| `description` | string | `"Short description"` | Brief summary (1-2 sentences) |
| `variant` | string | `"1xN"` or `"NxM"` | Board type |
| `boardWidth` | number | `1` to `6` | Number of files (columns) |
| `boardHeight` | number | `8` to `12` | Number of ranks (rows) |
| `startPosition` | string | See §4 | Encoded piece placement |
| `difficulty` | string | `"Beginner"` | Beginner \| Intermediate \| Advanced |
| `difficultyStars` | number | `3` | Rating from 1 to 5 |
| `icon` | string | `"🎯"` | Emoji icon for the mode |
| `help` | object | See below | Help modal content |
| `rules` | object | See §6 | Rule flags |

### Help Object Structure

```json
"help": {
  "challenge": "What is the player trying to do?",
  "solvabilityType": "COMPETITIVE",
  "hints": ["Hint 1", "Hint 2"],
  "solution": "Optional solution text or null",
  "strategy": {
    "whitePlan": "Optional",
    "blackPlan": "Optional",
    "keyPositions": "Optional"
  },
  "learningObjectives": ["What will player learn?"]
}
```

---

## 10) Frequently Asked Questions

**Q: Can I add a mode without knowing how to code?**
A: Yes! Just edit the JSON file following the examples. No programming needed.

**Q: How do I choose between `TACTICAL_PUZZLE` and `COMPETITIVE`?**
A: Puzzle = there's a specific solution to find. Competitive = open-ended game.

**Q: What if my position needs empty squares?**
A: Use `x` for empty squares. Example: `"wk,x,x,bk"` = King, empty, empty, King.

**Q: Can I make a 10×10 board?**
A: Technically yes, but performance may suffer on large boards. Stick to 8×8 or smaller for best experience.

**Q: How do I make the AI easier to beat?**
A: Use `"aiStrategy": "cooperative"` - the AI will make mistakes and help you win.

**Q: What's the difference between `variant: "1xN"` and `variant: "NxM"`?**
A: `1xN` is for single-file (1-D) chess. `NxM` is for boards with 2+ files (like 6×6 minichess).

**Q: Can I share my mode with others?**
A: Yes! Just share your mode's JSON. Others can copy it into their `game-modes.json` file.

**Q: Why does my mode fail validation?**
A: Run `npm run build` to see detailed error messages. Common issues:
- Typo in `solvabilityType`
- Piece count doesn't match board size
- Missing required fields
- JSON syntax error (missing comma/bracket)

**Q: Can I add custom piece types?**
A: Not currently. You're limited to standard pieces (K, Q, R, B, N, P).

**Q: What icons can I use for my mode?**
A: Any emoji! Popular choices: 🎯 🧩 ⚔️ 🏆 📚 🎓 ♟️ 👑

---

## 11) Next Steps

Once you've added your mode:

1. **Test thoroughly** - Play through the position multiple times
2. **Share with friends** - Get feedback on difficulty and fun factor
3. **Iterate** - Adjust hints, difficulty, or starting position based on feedback
4. **Consider contributing** - Submit your best modes to the project!

### Contributing Your Modes

Have a great mode you want to share with everyone? Consider:
1. Fork the repository on GitHub
2. Add your mode to `game-modes.json`
3. Test it thoroughly
4. Submit a Pull Request with description

Good modes to contribute:
- ✅ Well-tested positions
- ✅ Clear, helpful hints
- ✅ Appropriate difficulty rating
- ✅ Educational value
- ✅ Fun to play!

---

## 12) Getting Help

**Stuck? Here's how to get help:**

1. **Check the examples** - Copy a working example and modify it
2. **Validate your JSON** - Use https://jsonlint.com to find syntax errors
3. **Check the console** - Browser console (F12) shows detailed errors
4. **Review this guide** - Most questions are answered here
5. **Ask the community** - Create a GitHub issue or discussion

**When asking for help, include:**
- Your mode's JSON code
- What you expected to happen
- What actually happened
- Any error messages from console

---

Happy puzzle making! 🎉
