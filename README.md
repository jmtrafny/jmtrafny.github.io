# ♟️ Thin Chess

Master chess fundamentals through minimalist variants on narrow boards. Features **1-D Chess** (single-file line chess) with perfect-play solver and **Thin Chess** (2-3 file boards) with curated tactical and endgame challenges.

**[Play Now →](https://jmtrafny.github.io/jmtrafny.github.io/)**

---

## What is Thin Chess?

Thin Chess is a collection of chess variants played on extremely narrow boards (1-3 files). By stripping away the complexity of the full 8×8 board, these variants help you:

- **Master fundamental tactics** - Forks, pins, and skewers in simplified positions
- **Learn endgame technique** - King and rook mates, opposition, tempo play
- **Build pattern recognition** - Core chess principles without overwhelming complexity
- **Train calculation** - See deeper with fewer pieces and squares

### Current Game Modes

**1-D Chess** (2 modes)
- Single-file line chess with Kings, Rooks, and Knights
- Perfect-play solver provides instant evaluations
- Includes classic 12-square variant and compact 8-square "Monk" variant

**Classic Technique** (3 modes)
- Essential endgame patterns on 2×5, 2×6, and 3×5 boards
- K+R vs K ladder mate, K+Q vs K technique, K+B+N mate finish
- Progressive hint system with full solutions

---

## Features

✨ **Perfect-Play Solver** (1-D Chess) - Instant WIN/LOSS/DRAW evaluations with best move suggestions
🎮 **Interactive Board** - Touch and mouse-friendly with legal move highlighting
🧩 **Curated Challenges** - Tactical puzzles and endgame positions with progressive hints
📴 **Works Offline** - Installable PWA with full offline support
💾 **Position Sharing** - Export and import positions via compact text codes
⚡ **Instant Analysis** - Cached transposition table for fast repeated evaluations
🎯 **Progressive Hints** - Learn with step-by-step guidance and full solutions
🎲 **1-Player & 2-Player** - Play against the AI or challenge a friend

---

## Game Modes

### 1-D Chess

Single-file chess played on a vertical line. Pure tactical warfare with no board complexity.

**Available Modes:**
1. **♟️ 1-D Chess by ChessTraps** (⭐⭐⭐ Intermediate)
   - Classic 12-square setup with full piece complement
   - Deep strategy, multi-piece coordination
   - Perfectly balanced starting position

2. **♟️ Monk 1-D Chess** (⭐⭐ Intermediate)
   - Compact 8-square variant
   - Faster games, sharper tactics
   - Ideal for quick matches

**Rules:**
- **Board:** 1 file of 8-12 ranks (depending on variant)
- **Pieces:**
  - King (±1 square)
  - Rook (slides any distance)
  - Knight (jumps ±2 squares)
- **Win Conditions:** Checkmate opponent's king
- **Draw Conditions:** Stalemate or position repetition

**Solver Features:**
- Click **"Solve"** to see if the position is a win, loss, or draw
- Click **"Best Move"** to execute the optimal move
- Learn perfect play through instant feedback

---

### Classic Technique

Master essential endgame techniques on narrow boards. Each mode teaches a specific mating pattern.

**Available Modes:**

1. **🧩 Top-Rank Guillotine** (⭐ Beginner) - 2×6 board
   - Learn K+R vs K ladder mate
   - Drive the lone king to the edge
   - **Objective:** Textbook rook endgame technique

2. **👑 Royal Net** (⭐ Beginner) - 2×5 board
   - Learn K+Q vs K technique
   - Practice the queen "box" method
   - **Objective:** Elementary mate with queen, avoiding stalemate

3. **🗝️ Bishop+Knight Mate (Finish)** (⭐⭐⭐⭐ Advanced) - 3×5 board
   - Practice the trickiest basic checkmate
   - Position is near the finish line
   - **Objective:** Execute the final mating sequence

**Hint System:**
- Click **"?"** to view progressive hints
- Hints reveal one at a time (no spoilers!)
- Full solution available after viewing all hints
- Learning objectives clearly stated

---

## How to Play

### Getting Started

1. **Launch the app** - Visit the site or install as PWA
2. **Choose a game mode** - Select from 1-D Chess or Classic Technique categories
3. **Select game type:**
   - **1-Player:** Play as White against the AI
   - **2-Player:** Take turns on the same device
4. **Make moves** - Click/tap a piece, then click a highlighted target square

### Controls

**Move Controls:**
- **Click piece** → See legal moves (cyan dots)
- **Click target** → Make the move
- **Undo** (↶) → Take back last move
- **Redo** (↷) → Replay undone move

**1-D Chess Solver:**
- **Solve** → Evaluate position (WIN/LOSS/DRAW)
- **Best Move** → Execute optimal move instantly

**Classic Technique:**
- **? (Help)** → View hints and solutions
- Progressive hint system guides you step-by-step

**Game Controls:**
- **New Game** → Choose different mode or restart
- **Peace Treaty** → Resign or claim draw

---

## Position Codes

Share and save positions using compact text notation.

**1-D Chess (8 squares):**
```
bk,br,bn,x,x,wn,wr,wk:w
```

**1-D Chess (12 squares):**
```
bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w
```

**Thin Chess (2×6 board):**
```
x,bk/x,x/x,x/wk,x/wr,x/x,x:w
```

**Extended Format (with rule state):**
```
bk,br,bn,x,x,wn,wr,wk:w:-:0:0
                      │ │ │ └─ Castling rights
                      │ │ └─── Halfmove clock
                      │ └───── En passant target
                      └─────── Turn
```

**Format Guide:**
- Pieces: `wk` (white king), `br` (black rook), `wn` (white knight), etc.
- `x` = empty square
- Turn indicator: `:w` (white to move) or `:b` (black to move)
- **1-D Chess:** Comma-separated from top to bottom
- **Thin Chess:** Ranks separated by `/`, cells within ranks separated by `,`
- **Optional fields** (for advanced rules):
  - En passant target square index (or `-` for none)
  - Halfmove clock for fifty-move rule
  - Castling rights bitmask

---

## Learning Tips

### For 1-D Chess:
- **Use the solver** to check your intuition after thinking
- **Study "DRAW" positions** - these are perfectly balanced
- **Knights are powerful** - they can jump over traffic
- **Rooks need open lines** - avoid blocking them with your own pieces
- **King safety matters** - don't walk into checks

### For Classic Technique:
- **Read the hints before playing** - understand the goal first
- **Practice the pattern multiple times** - muscle memory matters
- **Compare to full-board versions** - principles transfer to 8×8 chess
- **Focus on opponent's king** - restrict it first, mate second
- **Watch for stalemate** - especially in K+Q vs K

---

## Installation

### As Progressive Web App (Recommended)

**Mobile (iOS/Android):**
1. Visit the site in your browser
2. Tap **"Share"** → **"Add to Home Screen"**
3. Launch from home screen icon
4. Works fully offline!

**Desktop (Chrome/Edge):**
1. Visit the site
2. Click the **install icon** in the address bar
3. Click **"Install"**
4. Launch from Applications/Start Menu

### Local Development

```bash
git clone https://github.com/jmtrafny/jmtrafny.github.io.git
cd jmtrafny.github.io
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run test suite
```

---

## Rule System

The chess engine supports configurable rule flags that can be enabled per game mode. This allows for faithful implementation of standard chess rules or experimentation with custom variants.

### Available Rule Flags

Each game mode can specify its own ruleset in `public/game-modes.json`:

```json
{
  "rules": {
    "castling": false,
    "enPassant": true,
    "fiftyMoveRule": true,
    "threefold": true,
    "promotion": true,
    "aiStrategy": "perfect"
  }
}
```

**Rule Descriptions:**

- **`promotion`** (boolean)
  - `true`: Pawns promote to Q/R/B/N on last rank (generates 4 move options)
  - `false`: "Freeze on last rank" - pawns can reach last rank but don't promote

- **`enPassant`** (boolean)
  - `true`: En passant captures enabled after double-step pawn moves
  - `false`: No en passant (pawns can only capture on occupied squares)

- **`fiftyMoveRule`** (boolean)
  - `true`: Game drawn after 100 plies (50 moves) without captures or pawn moves
  - `false`: No fifty-move rule tracking

- **`threefold`** (boolean)
  - `true`: Game drawn when same position occurs 3 times (same board, turn, EP, castling)
  - `false`: No repetition detection

- **`aiStrategy`** ("perfect" | "aggressive" | "cooperative")
  - `"perfect"`: AI always plays optimally (WIN > DRAW > LOSS) - best for competitive modes
  - `"aggressive"`: AI avoids draws, takes risks (WIN > LOSS > DRAW) - keeps game going
  - `"cooperative"`: AI only plays winning moves, otherwise random - helps player learn in puzzles
  - Defaults to `"perfect"` if omitted

- **`castling`** (boolean)
  - `true`: Castling enabled (king-side and queen-side) - *not yet fully implemented*
  - `false`: No castling moves generated

**Current Game Modes:** All existing modes use default rules (all flags `false`) for backward compatibility.

**Board-Agnostic Design:** All rules work correctly on any NxM board dimensions (1×8, 2×10, 3×5, etc.).

---

## Technical Details

**Architecture:**
- **Engine:** Pure TypeScript, zero runtime dependencies
- **1-D Chess Solver:** Tri-valued negamax with transposition table and repetition detection
- **Thin Chess AI:** Random legal move selection (positions too complex for perfect play)
- **UI Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Testing:** Vitest with comprehensive edge case coverage
- **Configuration:** JSON-based game mode system - add new modes without code changes

**Performance:**
- Solver evaluates 1-D Chess positions instantly (< 10ms typical)
- Transposition table caches results for repeated positions
- Responsive on all devices from phones to desktops

**Browser Support:**
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## Adding Custom Game Modes

Thin Chess uses a JSON configuration system. You can add new modes without writing code!

See [ADDING_MODES.md](ADDING_MODES.md) for the complete guide.

**Quick example:**
```json
{
  "id": "MY_NEW_MODE",
  "categoryId": "1d-chess",
  "name": "My Custom Mode",
  "variant": "1xN",
  "boardWidth": 1,
  "boardHeight": 10,
  "startPosition": "bk,br,bn,x,x,x,x,wn,wr,wk:w",
  "difficulty": "Intermediate",
  "difficultyStars": 3,
  "icon": "🎯"
}
```

---

## Contributing

Contributions welcome! Ways to help:

- **Add new game modes** - Use the JSON configuration system
- **Report bugs** - Open issues on GitHub
- **Suggest features** - Discuss in issues before implementing
- **Improve documentation** - Help others learn

See [DEVELOPER.md](DEVELOPER.md) for architecture details and technical documentation.

---

## Roadmap

**Planned Features:**
- More 1-D Chess variants (different starting positions)
- Additional endgame technique modes (R+P vs R, etc.)
- Move notation display (algebraic notation)
- Game analysis and position evaluation display
- Configurable AI difficulty for Thin Chess
- Opening trainer mode

---

## License

MIT © James Trafny

---

## Acknowledgments

- **1-D Chess** concept inspired by ChessTraps [YouTube channel](https://www.youtube.com/@chesstrapss)
- Built with React, TypeScript, and Vite
