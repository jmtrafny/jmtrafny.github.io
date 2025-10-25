# ♟️ 1-D Chess & Thin Chess

Minimalist chess variants: **1-D Chess (1×12)** with perfect-play solver and **Thin Chess (2×10)** with curated tactical challenges.

**[Play Now →](https://jmtrafny.github.io/jmtrafny.github.io/)**

---

## Variants

### 1-D Chess (1×12)
A single-file chess variant with Kings, Rooks, and Knights on a 1×12 board. Features a **perfect-play solver** that can solve any position instantly.

### Thin Chess (2×10)
A 2-file, 10-rank variant with Kings, Rooks, Knights, Bishops, and Pawns. Includes **5 curated challenges** ranging from beginner puzzles to advanced endgames.

---

## Features

✨ **Perfect-Play Solver** (1-D Chess) - Get instant WIN/LOSS/DRAW evaluations with best move suggestions
🎮 **Interactive Board** - Touch and mouse-friendly with legal move highlighting
🧩 **Curated Challenges** (Thin Chess) - 5 tactical puzzles and strategic positions with progressive hints
📴 **Works Offline** - Installable PWA with full offline support
💾 **Position Sharing** - Export and import positions via compact text codes
⚡ **Instant Analysis** - Cached transposition table for fast repeated evaluations
🎯 **Progressive Hints** - Learn with step-by-step guidance and full solutions

---

## 1-D Chess Rules

### Board
- 1 file of **12 ranks** (numbered 1-12 from top to bottom)
- Alternating light/dark squares

### Pieces
| Piece | Movement |
|-------|----------|
| **King (K)** | ±1 square |
| **Rook (R)** | Slides any distance in either direction |
| **Knight (N)** | Jumps exactly ±2 squares |

### Special Rules
- **Kings cannot move into check** (illegal move)
- **Rooks cannot jump** over pieces (sliding only)
- **Knights ignore** intervening pieces (leaper)
- **No legal moves + in check** = Checkmate (loss)
- **No legal moves + not in check** = Stalemate (draw)
- **Repetition** in solver search = Draw

### Starting Position

```
1  ♚  Black King
2  ♜  Black Rook
3  ♞  Black Knight
4  ♜  Black Rook
5  ♞  Black Knight
6  ·  Empty
7  ·  Empty
8  ♘  White Knight
9  ♖  White Rook
10 ♘  White Knight
11 ♖  White Rook
12 ♔  White King
```

White to move. This position is **perfectly balanced** according to the solver.

---

## Thin Chess (2×10)

### Board
- 2 files (a, b) of **10 ranks** = 20 squares total
- Pieces move as in standard chess, but on a narrow 2D board

### Pieces
All standard chess pieces: King, Rook, Knight, Bishop, Pawn
Movement rules identical to standard chess

### Curated Challenges

1. **🧩 Top-Rank Guillotine** (⭐ Beginner) - Mate in 2-3 moves
2. **📚 Mirror Towers** (⭐⭐⭐ Advanced) - Standard opening, learn piece development
3. **🎯 Pawn Corridors** (⭐⭐⭐ Intermediate) - Promotion race with tempo calculation
4. **👑 Bishop Duel** (⭐⭐⭐⭐ Advanced) - Fortress warfare and zugzwang
5. **🧩 Flip-Fork** (⭐⭐⭐ Intermediate) - Knight fork tactics

Each challenge includes:
- Clear goal description
- Progressive hints (reveal one at a time)
- Full solution with move explanations
- Learning objectives

See [THIN_CHESS_MODES.md](THIN_CHESS_MODES.md) for detailed challenge documentation.

---

## How to Play

1. **Choose a variant** - 1-D Chess, Thin Chess, or Thin Chess Challenges
2. **Click a piece** to select it and see legal target squares (cyan dots)
3. **Click a target** to move your piece there
4. **Use buttons:**
   - **Best Move** (1-D Chess only) - Execute the optimal move
   - **Solve** (1-D Chess only) - Evaluate position as WIN/LOSS/DRAW
   - **Undo/Redo** - Navigate move history
   - **New Game** - Change variant or restart
   - **Peace Treaty** - Resign or claim draw by repetition
   - **?** (Thin Chess Challenges) - View hints and solutions

### Position Codes

Share positions using compact text format:

**1-D Chess:**
```
bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w
```

**Thin Chess:**
```
x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w
```

Format:
- `w` = white, `b` = black
- `k`/`r`/`n`/`b`/`p` = king/rook/knight/bishop/pawn
- `x` = empty square
- `:w` or `:b` = side to move

---

## Installation

### As PWA (Recommended)
1. Visit the live site on mobile/desktop
2. Tap "Add to Home Screen" or "Install"
3. Launch from home screen - works fully offline!

### Local Development
```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run test suite
```

---

## Technical Highlights

- **Engine**: Pure TypeScript with zero dependencies
- **1-D Chess Solver**: Tri-valued negamax with transposition table and cycle detection
- **Thin Chess AI**: Random move selection (game tree too complex for perfect play)
- **UI**: React 19 with TypeScript and CSS
- **Build**: Vite for fast dev/build cycles
- **Testing**: Vitest with comprehensive edge case coverage
- **Deploy**: GitHub Actions → GitHub Pages

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## License

MIT © [Your Name]

---

## Contributing

Contributions welcome! See [DEVELOPER.md](DEVELOPER.md) for architecture details and contribution guidelines.

---

**Made with ♟️ by chess variant enthusiasts**
