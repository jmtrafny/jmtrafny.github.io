# ♟️ Thin Chess

A minimalist **1×12 chess variant** with a perfect-play solver. Play on a single column of 12 squares with simplified pieces: Kings, Rooks, and Knights.

**[Play Now →](https://jmtrafny.github.io/jmtrafny.github.io/)**

---

## Features

✨ **Perfect-Play Solver** - Get instant WIN/LOSS/DRAW evaluations with best move suggestions
🎮 **Interactive Board** - Touch and mouse-friendly with legal move highlighting
📴 **Works Offline** - Installable PWA with full offline support
💾 **Position Sharing** - Export and import positions via compact text codes
⚡ **Instant Analysis** - Cached transposition table for fast repeated evaluations
🎯 **Edge Case Handling** - Correct checkmate, stalemate, and repetition draw detection

---

## Rules

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

---

## How to Play

1. **Click a piece** to select it and see legal target squares (cyan dots)
2. **Click a target** to move your piece there
3. **Use buttons:**
   - **Best Move** - Execute the optimal move from current position
   - **Solve** - Evaluate position as WIN/LOSS/DRAW with depth
   - **Undo/Redo** - Navigate move history
   - **Reset** - Return to starting position
   - **Swap Side** - Change turn to move

### Position Codes

Share positions using compact text format:
```
bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w
```
- `w` = white, `b` = black
- `k`/`r`/`n` = king/rook/knight
- `x` = empty square
- 12 cells top→bottom
- `:w` or `:b` = side to move

---

## Starting Position

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
- **Solver**: Tri-valued negamax with transposition table and cycle detection
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
