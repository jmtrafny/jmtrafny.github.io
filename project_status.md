# Thin Chess — Project Status

**Status: ✅ MVP COMPLETE**
_Last updated: 2025-10-24_

## 1) Overview
Thin Chess is a minimalist 1×12 chess variant presented on a single column of squares. Pieces: king (±1), rook (any distance), knight (±2 jump). Kings cannot move into check. This web app provides an interactive board, perfect-play AI opponent, game over detection, position editor, and full PWA offline support. Deployed at [jmtrafny.github.io](https://jmtrafny.github.io).

## 2) Current Implementation

**Stack:**
- **React 19** + **TypeScript** + **Vite 7** (~1166 total LOC)
- **Vanilla CSS** with CSS custom properties (dark theme with gradient background)
- **GitHub Pages** deployment via GitHub Actions
- **PWA** with service worker and manifest.json

**Features Implemented:**
- ✅ Interactive 1×12 board with legal move highlighting
- ✅ Two game modes: 1-player (vs AI) and 2-player (local)
- ✅ Perfect-play AI using tri-valued negamax solver with transposition table
- ✅ Automatic game over detection (stalemate/checkmate) with visual banner
- ✅ Undo/Redo with full history management
- ✅ Position editor with load/copy functionality
- ✅ SVG chess pieces (6 high-quality graphics with transparent backgrounds)
- ✅ PWA install button (appears when app is installable)
- ✅ Fully offline-capable after first load
- ✅ Responsive design optimized for mobile and desktop

**UI Design:**
- Minimalist single-panel layout (no sidebar, no clutter)
- Header: Title (left) + Install button (right, conditional)
- Central board with coordinate numbers (1-12) aligned to squares
- Controls: New Game, Undo, Redo (3-column grid)
- Position Editor in collapsible details section
- Modal dialogs for game mode selection and color picker
- Game-over banner with animation when game ends

**Default State:**
- Game starts immediately in 1-player mode
- User plays as white (AI plays black)
- Board shows starting position: `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`

## 3) Architecture Decisions

### UI Simplification
**Decision:** Removed right instruction panel, solver display, side-to-move indicator, and status messages.
**Rationale:** Keep the experience clean and game-focused. Users learn by playing, not reading instructions. The board state is self-explanatory.

### Game Flow
1. **New Game button** → Modal with game mode selection (1-player / 2-player)
2. **1-player mode** → Color picker modal (white / black)
3. **2-player mode** → Game starts immediately
4. **Gameplay** → Click piece to select, click target to move
5. **Game over** → Banner displays result, board/buttons disabled

### AI Implementation
- **Solver:** Tri-valued negamax (WIN/LOSS/DRAW) with transposition table
- **Depth limit:** MAX_DEPTH = 50 to prevent stack overflow
- **AI delay:** 500ms artificial "thinking" time for better UX
- **Trigger:** useEffect watches `pos.turn` and calls `makeAIMove()` when it's AI's turn
- **Prevention:** `aiThinking` flag prevents double-triggering and user moves during AI turn

### Service Worker Strategy
**Problem:** Initial cache-first strategy caused stale cache issues (white screen on updates).
**Solution:** Implemented **Network First** for HTML/JS/CSS/JSON (always fetch fresh, cache as fallback) and **Cache First** for static assets (SVG, images).
**Cache versions:** `thin-chess-v2` and `thin-chess-static-v2` (bumped from v1 to force invalidation).
**Dev mode:** Service worker disabled in development (`import.meta.env.PROD` check in main.tsx).

### GitHub Pages Deployment
**Site Type:** User GitHub Pages (username.github.io)
**Base Path:** `'/'` (root, not `/jmtrafny.github.io/`)
**Why:** User/org pages are served at root domain, not in subdirectories like project pages.
**CI/CD:** GitHub Actions workflow builds on push to main, deploys via `actions/deploy-pages@v4`.

### State Management
- **React hooks** for all state (no Redux/context needed for this scale)
- **History management:** Array of encoded positions with index pointer for undo/redo
- **Game modes:** TypeScript union type `'1player' | '2player' | null`
- **PWA install:** Captures `beforeinstallprompt` event, shows install button conditionally

## 4) Rules (source of truth for engine)
- **Board**: 1 file of 12 ranks (indexed 0..11 internally, displayed as 1..12 top→bottom)
- **Pieces**: `k`, `r`, `n` with side `w`/`b`
- **Moves**: `k` moves ±1; `n` jumps ±2 (leaper; color-bound); `r` slides any distance ±1 direction. All captures by displacement. Rooks cannot jump over pieces. Knights ignore intervening squares. Kings may not move into check.
- **Game end**: no legal moves → if in check = **checkmate** (win for opponent); else **stalemate** (draw)
- **Repetition**: any cycle discovered by the solver is scored **draw**

## 5) Position Encoding
- 12 comma-separated tokens, top→bottom. Token set: `x` for empty; otherwise `[wb][krn]`
- Append the side to move as `:w` or `:b`
- Example (default start): `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`
- **Internal representation:** `.` used for empty cells (converted from/to `x` in encode/decode)

## 6) Files & Structure

```
jmtrafny.github.io/
├── src/
│   ├── engine.ts          # Move generation, legality, terminal detection, encode/decode
│   ├── solver.ts          # Tri-valued negamax with TT and cycle detection
│   ├── App.tsx            # Main React component (~370 lines)
│   ├── App.css            # Styling with CSS custom properties (~360 lines)
│   ├── main.tsx           # React entry point, PWA service worker registration
│   └── vite-env.d.ts      # TypeScript environment definitions
├── public/
│   ├── pieces/            # SVG chess piece graphics (6 files: wk,wr,wn,bk,br,bn)
│   ├── chess.svg          # App icon (used in manifest)
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker with network-first strategy
├── .github/workflows/
│   └── deploy.yml         # GitHub Actions deployment workflow
├── vite.config.ts         # Vite configuration (base: '/', terser minify)
├── package.json           # Dependencies (React 19, TypeScript, Vite)
├── tsconfig.json          # TypeScript configuration
└── project_status.md      # This file
```

**Total codebase:** ~1166 lines of TypeScript/TSX/CSS (excluding config/deps)

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
Push to `main` branch → GitHub Actions automatically builds and deploys to GitHub Pages.

### Service Worker Behavior
- **Development:** SW disabled (only registers in production)
- **Production:** SW uses network-first strategy for app code
- **Cache invalidation:** Bump `CACHE_NAME` version in `public/sw.js` to force updates
- **Testing:** Use "Unregister" in DevTools > Application > Service Workers if needed

### PWA Install Button
- Only shows when browser fires `beforeinstallprompt` event
- Hidden in dev mode since SW is disabled
- Works on Chrome, Edge, Safari (iOS 16.4+), and other Chromium browsers
- Disappears after successful installation

### Position Editor
- Access via "Position Editor" details section
- Paste position code → Load button
- Current position displayed in readonly textarea
- Copy button copies to clipboard

### Known Limitations
- **Solver depth limit:** MAX_DEPTH = 50 to prevent stack overflow on complex positions
- **No opening book:** Solver computes from scratch each move (cached in TT during game)
- **No undo during AI turn:** Buttons disabled while AI is thinking
- **No move animation:** Instant position updates (future enhancement)

## 8) Goals Achieved

### MVP Goals ✅
- ✅ Playable UI with touch/mouse support and legal-move highlighting
- ✅ Correct rule implementation (legal moves, check, checkmate, stalemate)
- ✅ Built-in solver with tri-valued outcomes and transposition table
- ✅ Position I/O with human-readable encoding
- ✅ PWA with offline support and install prompt
- ✅ GitHub Pages hosting with automated CI/CD

### Additional Features Implemented
- ✅ AI opponent with configurable player color
- ✅ 2-player local mode
- ✅ Game over detection with visual feedback
- ✅ Undo/Redo with full history
- ✅ High-quality SVG chess pieces
- ✅ Responsive design optimized for mobile
- ✅ Clean, minimalist UI without clutter

### Future Enhancements (Stretch Goals)
- ⏳ URL share (`?pos=`) with compressed state
- ⏳ Endgame tablebase cache in `localStorage`
- ⏳ Opening trainer mode with puzzles
- ⏳ Sound effects and haptics
- ⏳ Theme toggle (light/dark/high-contrast)
- ⏳ Move animation
- ⏳ Move history display
- ⏳ Export game as PGN or similar format

## 9) Technical Decisions Log

### Why React over vanilla JS?
- Component structure scales better for modals, board, controls
- State management with hooks is cleaner than manual DOM updates
- TypeScript integration is excellent
- React 19 is fast and modern (no legacy baggage)

### Why no state management library?
- App is simple enough for useState/useEffect
- No need for Redux/Zustand/Context for ~10 state variables
- Keeps bundle size small (~150KB gzipped)

### Why SVG pieces over Unicode?
- Better visual quality across platforms
- Transparent backgrounds show board colors
- Scalable to any size without pixelation
- Easier to customize/theme in future

### Why no test suite?
- This is a fun project, not production software
- Manual testing during development was sufficient
- Engine logic is simple enough to verify by playing
- Test infrastructure removed to reduce complexity

### Why network-first caching?
- Ensures users always get latest version when online
- Prevents stale cache bugs (white screen on updates)
- Still works offline by falling back to cache
- Static assets use cache-first for performance

### Why 500ms AI delay?
- Instant moves feel robotic and jarring
- Brief delay makes AI feel more natural
- Gives user time to see their move before board changes
- Prevents accidental double-clicks during AI turn

### Why MAX_DEPTH = 50?
- Prevents stack overflow on deep positions
- Most games resolve much faster than depth 50
- Solver is still strong enough for perfect play in practice
- Could be increased if needed, but 50 is safe

---

## For Future Contributors / Coding Agents

### Making Changes to the UI
- Edit `src/App.tsx` for React components and game logic
- Edit `src/App.css` for styling (uses CSS custom properties in `:root`)
- Board squares are 64×64px, coordinate numbers are 64px height to align
- Modal system uses overlay + card pattern with animations

### Making Changes to Game Logic
- Edit `src/engine.ts` for move generation, legality, terminal detection
- Edit `src/solver.ts` for AI behavior (negamax, TT, depth limits)
- Position encoding/decoding happens in `engine.ts` (encode/decode functions)
- Transposition table can be cleared via `clearTT()` when resetting game

### Making Changes to PWA
- Edit `public/manifest.json` for app metadata (name, colors, icons)
- Edit `public/sw.js` for caching strategy
- Remember to bump `CACHE_NAME` version when changing SW logic
- Service worker only runs in production (disabled in dev)

### Deploying Changes
1. Commit and push to `main` branch
2. GitHub Actions runs automatically
3. Wait ~2 minutes for build + deploy
4. Visit https://jmtrafny.github.io to see changes
5. Users may need to close/reopen app to get SW update

### Testing Locally
- Run `npm run dev` for development server
- Service worker won't run (disabled in dev mode)
- Use `npm run build && npm run preview` to test production build with SW

### Common Pitfalls
- **Don't change `vite.config.ts` base path** - Must stay `'/'` for user GitHub Pages
- **Don't forget to bump SW version** when changing caching logic
- **Don't remove `import.meta.env.PROD` check** from main.tsx SW registration
- **Don't use cache-first for HTML/JS** - Causes white screen on updates

---

**End of Project Status Document**
