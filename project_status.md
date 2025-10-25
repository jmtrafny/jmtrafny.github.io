# 1-D Chess & Thin Chess — Project Status

**Status: ✅ PRODUCTION READY**
_Last updated: 2025-10-24_

## 1) Overview
This project features two minimalist chess variants:
- **1-D Chess (1×N)**: Single-file chess variant with variable board lengths (6, 7, 8, 9, 12 squares). Features Kings, Rooks, and Knights. Includes perfect-play solver.
- **Thin Chess (M×N)**: Multi-file narrow-board variant with variable dimensions (2×10, 3×8). Features all standard pieces including Queens (K, R, N, B, P, Q). Includes 6 curated tactical challenges.

Deployed at **[thinchess.com](https://thinchess.com)** (also available at [jmtrafny.github.io](https://jmtrafny.github.io)).

## 2) Current Implementation

**Stack:**
- **React 19** + **TypeScript** + **Vite 7** (~1400 total LOC)
- **Vanilla CSS** with CSS custom properties (dark theme with gradient background)
- **GitHub Pages** deployment via GitHub Actions
- **PWA** with service worker and manifest.json

**Features Implemented:**

### Core Game Engine
- ✅ Interactive boards for both variants with legal move highlighting
- ✅ Variant selector on startup (1-D Chess, Thin Chess, Thin Chess Challenges)
- ✅ Two game modes: 1-player (vs AI) and 2-player (local)
- ✅ Automatic game over detection (stalemate/checkmate) with visual banner
- ✅ Draw by repetition detection and claim button
- ✅ Resignation option with confirmation dialog
- ✅ Undo/Redo with full history management
- ✅ Position editor with load/copy functionality
- ✅ Responsive design optimized for mobile and desktop

### 1-D Chess Specific
- ✅ Variable board lengths (6, 7, 8, 9, 12 squares)
- ✅ Perfect-play AI using tri-valued negamax solver with transposition table
- ✅ Instant position evaluation (WIN/LOSS/DRAW with depth)
- ✅ Cached solver results for repeated positions
- ✅ **5 Curated Challenge Modes**:
  1. **📚 Original 1-D Chess** (⭐⭐⭐⭐ Classic) - 12 squares, full setup
  2. **🎯 Minimal Knights Duel** (⭐⭐ Puzzle) - 6 squares (7/10)
  3. **📚 Classic 1D Chess** (⭐⭐⭐ Classic) - 8 squares, Martin Gardner (8/10)
  4. **⚖️ Rook vs Rook & Knight** (⭐⭐⭐ Asymmetric) - 9 squares (7/10)
  5. **⚖️ Two Knights vs Rook** (⭐⭐⭐ Asymmetric) - 7 squares (8/10)

### Thin Chess Specific
- ✅ Full 2D chess movement (King, Rook, Knight, Bishop, Pawn, Queen)
- ✅ Variable board dimensions (2×10, 3×8 supported)
- ✅ Pawn promotion to any piece
- ✅ Diagonal queen movement on wider boards
- ✅ Random-move AI (game tree too large for perfect solver)
- ✅ **6 Curated Challenges** with progressive hint system:
  1. **🧩 Top-Rank Guillotine** (⭐ Beginner) - K+R vs K mate puzzle (6/10)
  2. **📚 Mirror Towers** (⭐⭐⭐ Advanced) - Standard opening (9/10)
  3. **🎯 Pawn Corridors** (⭐⭐⭐ Intermediate) - Promotion race (7/10)
  4. **👑 Bishop Duel** (⭐⭐⭐⭐ Advanced) - Opposite-color bishops (8/10)
  5. **🧩 Flip-Fork** (⭐⭐⭐ Intermediate) - Knight fork tactics (8/10)
  6. **⚖️ Three-File Showdown** (⭐⭐⭐⭐ Advanced) - Queen vs R+N on 3×8 (8/10)

### Challenge Mode Features
- ✅ Mode cards with type icons (🧩 Puzzle, 📚 Baseline, 🎯 Tactical, 👑 Endgame)
- ✅ Difficulty stars (⭐ 1-5 scale)
- ✅ "?" help button on each mode card
- ✅ Progressive hint system (Hint 1 → Hint 2 → Full Solution)
- ✅ Strategic guidance for competitive modes
- ✅ Learning objectives for each challenge
- ✅ Solvability indicators (Forced Win, Tactical Puzzle, Competitive, Drawish)

### Audio & Visual
- ✅ Sound effects for moves, captures, and game outcomes
- ✅ Mute toggle with localStorage persistence
- ✅ SVG chess pieces (10 high-quality graphics with transparent backgrounds)
- ✅ Alternating checkerboard pattern for 2×10 board
- ✅ Coordinate labels for both variants

### PWA & Deployment
- ✅ PWA install button (appears when app is installable)
- ✅ Custom domain (thinchess.com) with HTTPS
- ✅ Open Graph meta tags for rich social media previews
- ✅ Fully offline-capable after first load
- ✅ Service worker with network-first strategy

**UI Design:**
- Minimalist single-panel layout (no sidebar, no clutter)
- Header: Dynamic title showing variant/mode + Sound toggle + Install button (conditional)
- Central board with coordinate labels (1-12 for 1-D, a-b/1-10 for Thin)
- Controls: New Game, Undo, Redo (3-column grid)
- Peace Treaty button: Dual-purpose resign/draw claim with dynamic styling
- Position Editor in collapsible details section
- Modal dialogs for variant selection, mode pack, game mode, and help
- Game-over banner with animation when game ends
- Help modal with progressive hint reveal system

**Default State:**
- Game starts with variant selection modal
- Three options: 1-D Chess, Thin Chess, Thin Chess Challenges
- After variant selected, choose 1-player or 2-player mode
- 1-player mode prompts for color selection

## 3) Architecture Decisions

### Multi-Variant System
**Decision:** Unified engine with variant parameter (`'thin'` | `'skinny'`) supporting different board sizes.
**Rationale:** Code reuse for common logic (check detection, move application) while allowing variant-specific movement generation.

**Internal Naming (Code):**
- `'thin'` = 1-D Chess (1×12)
- `'skinny'` = Thin Chess (2×10)

**User-Facing Naming:**
- "1-D Chess" = 1-D Chess (1×12)
- "Thin Chess" = Thin Chess (2×10)
- "Thin Chess Challenges" = Curated mode pack

**Implementation:**
- `BoardConfig` interface defines dimensions for each variant
- `CONFIGS` object maps variant types to configurations
- All engine functions accept `Position` with embedded variant field
- Position encoding/decoding handles both formats (comma-separated vs rank-separated)

### Thin Chess AI Strategy
**Problem:** Thin Chess (2×10) has exponentially larger game tree than 1-D Chess (1×12).
**Solution:** Random move selection for Thin Chess instead of perfect solver.
**Rationale:**
- Branching factor ~11 moves average in Thin Chess vs ~5 in 1-D Chess
- Depth-20 search hits max depth 47,549 times, freezing browser
- Random AI provides playable opponent for casual games and mode challenges

### Challenge Mode System
**Decision:** Built-in help system with progressive hints instead of external documentation.
**Rationale:**
- Prevents frustration (users can get help without leaving the app)
- Progressive disclosure (hints before full solution)
- Educational value (learning objectives explain concepts)
- Better UX than forcing users to search for solutions

**Data Structure:**
```typescript
interface ModeHelp {
  challenge: string;
  solvabilityType: 'FORCED_WIN_WHITE' | 'TACTICAL_PUZZLE' | 'COMPETITIVE' | 'DRAWISH';
  hints: string[];
  solution?: string;
  strategy?: { whitePlan, blackPlan, keyPositions };
  learningObjectives: string[];
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  icon: '🧩' | '⚖️' | '📚' | '🎯' | '👑';
}
```

### UI Simplification
**Decision:** Removed right instruction panel, solver display (for Thin Chess), side-to-move indicator.
**Rationale:** Keep experience clean and game-focused. Users learn by playing. Board state is self-explanatory.

### Game Flow
1. **Startup** → Variant selection modal (1-D Chess / Thin Chess / Thin Chess Challenges)
2. **Mode Pack** (optional) → Grid of 5 challenge cards with help buttons
3. **Game Mode** → 1-player or 2-player selection
4. **1-player Mode** → Color picker modal (white / black)
5. **Gameplay** → Click piece to select, click target to move
6. **Game Over** → Banner displays result, board/buttons disabled

### Service Worker Strategy
**Problem:** Initial cache-first strategy caused stale cache issues (white screen on updates).
**Solution:** **Network First** for HTML/JS/CSS/JSON (always fetch fresh, cache as fallback) and **Cache First** for static assets (SVG, images).
**Cache versions:** `thin-chess-v2` and `thin-chess-static-v2` (bumped from v1 to force invalidation).
**Dev mode:** Service worker disabled in development (`import.meta.env.PROD` check in main.tsx).

### GitHub Pages Deployment
**Site Type:** User GitHub Pages (username.github.io)
**Custom Domain:** thinchess.com (configured via CNAME file in public/)
**Base Path:** `'/'` (root, not `/jmtrafny.github.io/`)
**Why:** User/org pages are served at root domain, not in subdirectories like project pages.
**CI/CD:** GitHub Actions workflow builds on push to main, deploys via `actions/deploy-pages@v4`.
**DNS Configuration:**
- 4× A records pointing to GitHub Pages IPs (185.199.108-111.153)
- CNAME record for www subdomain → jmtrafny.github.io
- HTTPS automatically provisioned via Let's Encrypt

### State Management
- **React hooks** for all state (no Redux/context needed for this scale)
- **History management:** Array of encoded positions with index pointer for undo/redo
- **Variant tracking:** Current variant stored in position object
- **Mode selection:** Selected mode stored in state, displayed in header
- **Help modal:** Progressive hint level state (0 = no hints, 1/2 = hints revealed, 3 = solution)

## 4) Rules (source of truth for engine)

### 1-D Chess (1×12)
- **Board**: 1 file of 12 ranks (indexed 0..11 internally, displayed as 1..12 top→bottom)
- **Pieces**: `k`, `r`, `n` with side `w`/`b`
- **Moves**: `k` moves ±1; `n` jumps ±2 (leaper; color-bound); `r` slides any distance ±1 direction. All captures by displacement. Rooks cannot jump over pieces. Knights ignore intervening squares. Kings may not move into check.
- **Game end**: no legal moves → if in check = **checkmate** (win for opponent); else **stalemate** (draw)
- **Repetition**: twofold repetition (position appears 2+ times) can be claimed as **draw** via UI button
- **Resignation**: players can resign at any time with confirmation dialog

### Thin Chess (2×10)
- **Board**: 2 files (a, b) of 10 ranks = 20 squares (indexed row-major 0..19)
- **Pieces**: `k`, `r`, `n`, `b`, `p` with side `w`/`b`
- **Moves**: Standard chess movement adapted to 2D board
  - King: 8 directions (±1 orthogonal, ±1 diagonal)
  - Rook: Orthogonal sliding (up/down/left/right)
  - Knight: L-shape (2 in one direction, 1 perpendicular)
  - Bishop: Diagonal sliding (4 diagonal directions)
  - Pawn: Forward 1, captures diagonally forward, promotes on opposite rank
- **Same rules**: Check, checkmate, stalemate, repetition, resignation

## 5) Position Encoding

### 1-D Chess (1×12)
- 12 comma-separated tokens, top→bottom. Token set: `x` for empty; otherwise `[wb][krn]`
- Append the side to move as `:w` or `:b`
- Example (default start): `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`
- **Internal representation:** `.` used for empty cells (converted from/to `x` in encode/decode)

### Thin Chess (2×10)
- Ranks separated by `/`, each rank has two cells separated by `,`
- Token set: `x` for empty; otherwise `[wb][krnbp]`
- Append side to move as `:w` or `:b`
- Example: `x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w`

## 6) Files & Structure

```
jmtrafny.github.io/
├── src/
│   ├── engine.ts          # Multi-variant move generation, encoding, terminal detection
│   ├── solver.ts          # Tri-valued negamax with TT (used for 1-D Chess)
│   ├── audio.ts           # Sound effects management
│   ├── App.tsx            # Main React component (~650 lines)
│   ├── App.css            # Styling with variant-specific layouts (~730 lines)
│   ├── main.tsx           # React entry point, PWA service worker registration
│   └── vite-env.d.ts      # TypeScript environment definitions
├── public/
│   ├── pieces/            # SVG chess piece graphics (12 files: wk,wq,wr,wn,wb,wp,bk,bq,br,bn,bb,bp)
│   ├── sounds/            # Sound effects (move, capture, victory, defeat, draw MP3s)
│   ├── chess.svg          # App icon
│   ├── white-pawn.svg     # Title icon
│   ├── banner.png         # Social media Open Graph banner (1200×630px)
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker with network-first strategy
│   └── CNAME              # Custom domain file (thinchess.com)
├── .github/workflows/
│   └── deploy.yml         # GitHub Actions deployment workflow
├── README.md              # Project overview and usage
├── DEVELOPER.md           # Developer documentation
├── THIN_CHESS_MODES.md    # Detailed challenge mode documentation
├── project_status.md      # This file
├── index.html             # HTML entry point with Open Graph meta tags
├── vite.config.ts         # Vite configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

**Total codebase:** ~1400 lines of TypeScript/TSX/CSS (excluding config/deps)

## 7) Development Notes

### Running Locally
```bash
npm install
npm run dev        # Start dev server (http://localhost:5173)
```

### Building for Production
```bash
npm run build      # Creates dist/ directory
npm run preview    # Preview production build locally
```

### Deployment
Push to `main` branch → GitHub Actions automatically builds and deploys to GitHub Pages → Live at **thinchess.com**

### Known Limitations
- **1-D Chess solver depth limit:** MAX_DEPTH = 50 to prevent stack overflow
- **Thin Chess AI:** Random moves only (no perfect solver due to complexity)
- **No opening book:** Solver/AI computes from scratch each move
- **No undo during AI turn:** Buttons disabled while AI is thinking
- **No move animation:** Instant position updates (future enhancement)
- **Repetition detection:** Requires manual claim (no automatic draw after threefold)

## 8) Goals Achieved

### MVP Goals ✅
- ✅ Two playable variants with distinct strategic depth
- ✅ Correct rule implementation for both variants
- ✅ Perfect-play solver for 1-D Chess
- ✅ Random-move AI for Thin Chess
- ✅ Position I/O with variant-aware encoding
- ✅ PWA with offline support
- ✅ GitHub Pages hosting with automated CI/CD

### Thin Chess Challenges ✅
- ✅ 5 curated tactical/strategic positions
- ✅ Progressive hint system (3 levels)
- ✅ Full solutions with move explanations
- ✅ Solvability indicators
- ✅ Learning objectives
- ✅ Difficulty ratings (1-5 stars)
- ✅ Type icons and badges
- ✅ In-app help modal

### Additional Features Implemented
- ✅ Multi-variant architecture
- ✅ Variant selector on startup
- ✅ Dynamic board rendering (1×12 and 2×10)
- ✅ Sound effects with mute toggle
- ✅ Custom domain with HTTPS
- ✅ Open Graph social media tags
- ✅ Undo/Redo system
- ✅ Draw by repetition detection
- ✅ Resignation with confirmation
- ✅ Responsive mobile design

### Future Enhancements (Stretch Goals)
- ⏳ Additional Thin Chess challenge modes
- ⏳ Opening trainer mode for 1-D Chess
- ⏳ Move animation
- ⏳ Move history display
- ⏳ Position sharing via URL
- ⏳ Theme toggle (light/dark modes)
- ⏳ Export game notation

## 9) Technical Decisions Log

### Why multi-variant architecture?
- Maximizes code reuse for common logic (check detection, move application)
- Single codebase easier to maintain than separate apps
- Unified UI/UX reduces learning curve
- Position encoding format easily extensible

### Why random AI for Thin Chess?
- Game tree 10-20× larger than 1-D Chess
- Perfect solver would freeze browser for minutes
- Random AI provides adequate challenge for casual play
- Allows focus on curated challenge modes for serious study

### Why progressive hints?
- Reduces frustration (users don't get stuck)
- Encourages learning (reveal hints gradually)
- Maintains challenge (users can choose to solve without hints)
- Better UX than forcing users to search external documentation

### Why 5 challenges instead of 10?
- Quality over quantity (well-tested, interesting positions)
- Better difficulty curve (beginner → advanced)
- Less overwhelming for new players
- Room to add more challenges in future

---

## For Future Contributors / Coding Agents

### Making Changes to Variants
- Edit `src/engine.ts` for game rules and movement logic
- BoardConfig system handles dimension differences
- All functions accept variant parameter via Position object
- Test both variants after any engine changes

### Adding New Challenges
1. Add mode to `SKINNY_MODE_PACK` or `THIN_MODE_PACK` array in `src/engine.ts`
2. For non-standard dimensions, specify: `boardWidth: 3, boardLength: 8` (Thin Chess) or `boardLength: 9` (1-D Chess)
3. Add help content to `MODE_HELP_CONTENT` object
4. Include: challenge, hints, solution, learning objectives, difficulty, icon
5. Update `THIN_CHESS_MODES.md` documentation
6. Test mode loads correctly with proper board size and hints work

### Updating Variant Names
- User-facing: Update strings in `App.tsx`, `index.html`, `README.md`
- Internal: Keep `'thin'` and `'skinny'` unchanged (avoids breaking positions)
- Comments: Update in `engine.ts` header

### Common Pitfalls
- **Don't change internal variant names** (`'thin'`/`'skinny'`) - breaks position encoding
- **Don't forget to test both variants** after engine changes
- **Don't skip hint testing** - ensure progressive reveal works correctly
- **Don't use cache-first for HTML/JS** - causes white screen on updates

---

**End of Project Status Document**
