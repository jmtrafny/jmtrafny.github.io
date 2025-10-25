# Thin Chess - Developer Documentation

Technical documentation for contributors and developers.

---

## Architecture Overview

The project follows a clean separation of concerns:

```
src/
├── engine.ts      # Game rules and move generation
├── solver.ts      # Perfect-play solver with TT
├── audio.ts       # Sound effects management
├── App.tsx        # React UI component
├── App.css        # Styles
└── main.tsx       # Entry point + SW registration

public/
├── pieces/        # SVG chess piece graphics (6 files)
├── sounds/        # Sound effects (MP3: move, capture, victory, defeat, draw)
├── manifest.json  # PWA manifest
├── sw.js          # Service worker (network-first strategy)
├── banner.png     # Social media Open Graph image
├── chess.svg      # Favicon
└── CNAME          # Custom domain configuration

.github/workflows/
└── deploy.yml     # GitHub Actions CI/CD

index.html         # Entry point with Open Graph meta tags
```

---

## Core Modules

### `engine.ts`

**Responsibilities:**
- Position encoding/decoding (`encode`, `decode`)
- Move generation (`legalMoves`)
- Attack detection (`attacked`)
- Move application (`applyMove`)
- Terminal state detection (`terminal`)
- King safety validation

**Key Types:**
```typescript
type Side = 'w' | 'b';
type PieceType = 'k' | 'r' | 'n';
type Piece = `${Side}${PieceType}`;
type Cell = Piece | '.';
type Board = Cell[];

interface Position {
  board: Board;
  turn: Side;
}

interface Move {
  from: number;
  to: number;
}
```

**Key Functions:**
- `legalMoves(pos)` - Generate all legal moves for current position
- `applyMove(pos, move)` - Apply a move and return new position
- `terminal(pos)` - Check if position is terminal (checkmate/stalemate)
- `detectRepetition(history, currentPos)` - Count position occurrences in history
- `attacked(board, side, idx)` - Check if square is attacked by opponent
- `isCheck(pos)` - Check if current side is in check

**Position Encoding:**
```
Format: "cell,cell,...,cell:side"
Example: "bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w"
- 12 cells (0-11, top to bottom)
- x = empty, [wb][krn] = piece
- :w or :b = side to move
```

---

### `solver.ts`

**Responsibilities:**
- Tri-valued negamax search (WIN/LOSS/DRAW)
- Transposition table caching
- Cycle detection (repetition = draw)
- Best move selection

**Algorithm:**
1. Check TT for cached result
2. Check if position in search path (cycle)
3. Check if terminal (mate/stalemate)
4. Recursively evaluate all legal moves
5. Apply negamax logic:
   - If any child LOSS → current WIN (take it immediately)
   - Else if any child DRAW → current DRAW (prefer over LOSS)
   - Else all children WIN → current LOSS (delay mate)

**Key Function:**
```typescript
function solve(pos: Position, path: Set<string>): SolveResult {
  res: 'WIN' | 'LOSS' | 'DRAW',
  depth: number,
  best?: Move
}
```

**Optimization:**
- Transposition table avoids re-solving identical positions
- Cycle detection via path set prevents infinite loops
- Immediate WIN cutoff (alpha-beta style)

---

### `audio.ts`

**Responsibilities:**
- Preload sound effects on app initialization
- Play sounds for moves, captures, and game outcomes
- Mute toggle with localStorage persistence
- Graceful error handling for missing files

**Key Functions:**
```typescript
initAudio()          // Preload all sounds, load mute state
playMove()           // Play piece movement sound
playCapture()        // Play capture sound
playVictory()        // Play win sound
playDefeat()         // Play loss sound
playDraw()           // Play draw/stalemate sound
toggleMute()         // Toggle mute state, save to localStorage
```

**Sound Files:**
- Located in `public/sounds/`
- Format: MP3
- Recommended size: < 100KB each
- Sources: Pixabay (CC0), Freesound.org (Creative Commons)

---

### `App.tsx`

**Responsibilities:**
- React component state management
- User interaction handlers
- Board rendering
- Move history (undo/redo)
- Game mode selection (1-player vs 2-player)
- AI move triggering
- Sound effect integration
- UI controls (buttons, position editor, mute toggle)

**State:**
```typescript
pos: Position            // Current position
history: string[]        // Position codes history
hIndex: number           // Current history index
sel: number | null       // Selected square
targets: number[]        // Legal target squares
gameMode: GameMode       // '1player' | '2player' | null
playerSide: Side | null  // Player's color in 1-player mode
aiThinking: boolean      // AI move in progress flag
gameOver: boolean        // Game ended flag
gameResult: string       // Game over message
soundMuted: boolean      // Sound mute state
showInstallButton: boolean // PWA install button visibility
repetitionDetected: boolean // Position repetition detected (twofold)
```

---

## Development Workflow

### Setup
```bash
git clone https://github.com/jmtrafny/jmtrafny.github.io.git
cd jmtrafny.github.io
npm install
```

### Local Development
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Building
```bash
npm run build        # Production build → dist/
npm run build:gh     # Build with GitHub Pages base path
npm run preview      # Preview production build
```

### Deployment
- **Automatic**: Push to `main` triggers GitHub Actions workflow → deploys to **thinchess.com**
- **Manual**: Run `npm run build:gh`, commit `dist/` (not recommended)

### Custom Domain Setup
1. Purchase domain (e.g., thinchess.com via GoDaddy)
2. Add `public/CNAME` file with domain name
3. Configure DNS in registrar:
   - 4× A records → GitHub Pages IPs (185.199.108-111.153)
   - CNAME for www → jmtrafny.github.io
4. Enable "Enforce HTTPS" in GitHub Pages settings
5. Wait for Let's Encrypt SSL provisioning (~30-60 min)

### Adding Sound Effects
1. Download MP3 files from [Pixabay](https://pixabay.com/sound-effects/) or [Freesound.org](https://freesound.org)
2. Save to `public/sounds/`:
   - `move.mp3` - Piece movement sound
   - `capture.mp3` - Capture sound
   - `victory.mp3` - Win sound (~1-2 sec)
   - `defeat.mp3` - Loss sound (~1-2 sec)
   - `draw.mp3` - Draw/stalemate sound (~1-2 sec)
3. Files are preloaded on app init
4. Graceful fallback if files missing (console.debug only)

### Social Media Preview
1. Update `public/banner.png` (1200×630px recommended)
2. Edit Open Graph meta tags in `index.html`
3. Test with:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
4. Force re-scrape to clear cache

---

## Testing Strategy

### Engine Tests (`engine.test.ts`)

✅ **Position encoding/decoding**
- Start position correctness
- Symmetry (encode ∘ decode = identity)
- Empty square handling

✅ **Move generation**
- King ±1 moves
- Knight ±2 jumps
- Rook sliding (empty squares)
- Rook blocking (friendly pieces)
- Rook captures (enemy pieces)

✅ **King safety**
- Cannot move into check
- Attack detection (king, knight, rook)
- Blocked rook rays

✅ **Terminal states**
- Checkmate detection
- Stalemate detection
- Non-terminal positions

✅ **Move application**
- Turn switching
- Piece captures
- Board immutability

### Solver Tests (`solver.test.ts`)

✅ **Terminal evaluation**
- Immediate checkmate (LOSS)
- Stalemate (DRAW)

✅ **Search correctness**
- Finding winning moves
- Cycle detection (DRAW)
- Transposition table caching
- Delay-mate heuristic

---

## Code Style

### TypeScript
- Strict mode enabled
- Explicit types for public APIs
- Inferred types for locals
- No `any` types

### React
- Functional components with hooks
- Single component file (`App.tsx`)
- CSS modules avoided (global CSS is fine for small app)

### Naming
- `camelCase` for functions/variables
- `PascalCase` for types/components
- `UPPER_SNAKE_CASE` for constants
- Descriptive names over abbreviations

---

## Performance Considerations

### Solver Optimization
- **Transposition Table**: Avoids re-solving ~90%+ of positions in typical games
- **Immediate Cutoffs**: WIN found → stop search immediately
- **Cycle Detection**: O(1) set lookup prevents infinite loops
- **Depth Limiting**: Could add max depth if search too slow (not needed for 1×12)

### UI Optimization
- **React**: Only re-renders on state change
- **Legal Move Calc**: Only on piece selection (not every render)
- **Service Worker**: Pre-caches all assets (instant offline load)

### Potential Improvements
- **Alpha-Beta Pruning**: Not implemented (tri-valued search less compatible)
- **Move Ordering**: Could prioritize captures/checks for faster cutoffs
- **Iterative Deepening**: Not needed (positions solve fast enough)
- **Bitboards**: Overkill for 1×12 (array lookups are fast)

---

## PWA Configuration

### Manifest (`public/manifest.json`)
- Name: "Thin Chess"
- Display: standalone (no browser chrome)
- Orientation: portrait-primary
- Icons: 192×192, 512×512 (need to generate actual PNGs)

### Service Worker (`public/sw.js`)
- **Strategy**: Network-first for HTML/JS/CSS/JSON, Cache-first for static assets (images, SVG)
- **Caches**: Two caches - `thin-chess-v2` (app code) and `thin-chess-static-v2` (assets)
- **Versioning**: Bump `CACHE_NAME` to force cache invalidation on updates
- **Cleanup**: Old caches deleted on activate
- **Development**: Disabled in dev mode (only registers when `import.meta.env.PROD`)

### Installation
- PWA installable on all modern browsers (Chrome, Edge, Safari 16.4+)
- Works fully offline after first load
- Updates automatically when new version deployed
- Install button appears in header when `beforeinstallprompt` fires

---

## GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

**Trigger**: Push to `main` or manual dispatch

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Build with `GH_PAGES=true` env var
5. Upload build artifact
6. Deploy to GitHub Pages

**Permissions**:
- `contents: read` - Read repo
- `pages: write` - Deploy to Pages
- `id-token: write` - OIDC auth

**Settings Required**:
- GitHub Pages: Source = "GitHub Actions"
- No `gh-pages` branch needed

---

## Game Features

### Draw by Repetition

**Detection**: The game automatically detects when a position has repeated (twofold repetition):
- Uses `detectRepetition(history, currentPos)` to count occurrences
- Triggers when position appears 2+ times in game history
- Updates `repetitionDetected` state via `useEffect` on every position change

**UI Indicator**: "Peace Treaty" button in controls:
- **Normal state**: Shows 🏳️ icon, "Resign" label (gray/muted styling)
- **Active state**: Shows ⚖️ icon, "Claim Draw" label (cyan glow + pulse animation)
- **Tooltip**: Explains current action ("Position repeated - claim draw" vs "Resign this game")

**Button Behavior**:
- When repetition detected → Ends game as "Draw by Repetition", plays draw sound
- When no repetition → Shows confirmation dialog, ends game as resignation, plays defeat sound
- Disabled during AI thinking or when game is already over

**Styling**: Located in `App.css` under `.peace-btn` class with `.active` modifier for repetition state

### Resignation

Players can resign at any time using the "Peace Treaty" button:
- **1-player mode**: "You resigned - AI wins"
- **2-player mode**: "[Color] resigned - [Winner] wins"
- Requires confirmation dialog to prevent accidental clicks
- Plays defeat sound effect on confirmation

---

## Common Tasks

### Adding a New Piece Type
1. Update `PieceType` in `engine.ts`
2. Add movement logic in `legalMoves()`
3. Update `UNICODE` mapping
4. Add attack detection in `attacked()`
5. Write tests for new piece

### Changing Board Size
*Not recommended (spec locked to 1×12), but if needed:*
1. Update board length constant
2. Adjust `decode()` validation
3. Update CSS grid rows
4. Update coordinate labels in `App.tsx`
5. Re-test all edge cases

### Debugging Solver
1. Add logging in `solve()`:
   ```typescript
   console.log(`Solving ${key}: depth=${depth}`);
   ```
2. Use small positions (2-3 pieces)
3. Check TT size: `import { getTTSize } from './solver'`
4. Verify terminal detection working

### Optimizing Build Size
- Current bundle: ~100KB (uncompressed)
- Vite tree-shaking removes unused code
- Minification enabled by default
- Consider: compress service worker cache list

---

## Contribution Guidelines

### Pull Requests
1. Fork repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Write tests for new functionality
4. Ensure `npm test` passes
5. Ensure `npm run build` succeeds
6. Submit PR with clear description

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Example: `feat: add knight piece type`

### Code Review Checklist
- [ ] Tests added/updated
- [ ] TypeScript types correct
- [ ] No console.log left in code
- [ ] README updated if needed
- [ ] Build passes locally

---

## Troubleshooting

### "Cannot find module" errors
- Run `npm install`
- Check `tsconfig.json` paths
- Restart TS server in editor

### Tests failing
- Clear TT: `clearTT()` in `beforeEach()`
- Check position encoding (typos in test strings)
- Verify board index (0-11, not 1-12)

### Service worker not updating
- Hard refresh (Ctrl+Shift+R)
- Update `CACHE_NAME` in `sw.js`
- Unregister SW in DevTools → Application

### GitHub Pages 404
- Check base path in `vite.config.ts` (should be `'/'` for user pages)
- Verify GitHub Pages source = "Actions"
- Check workflow run logs
- Verify `CNAME` file exists in `public/` directory
- Check DNS propagation with [whatsmydns.net](https://www.whatsmydns.net)

### Custom Domain Issues
- **www not working**: Verify CNAME record points to `jmtrafny.github.io`
- **HTTPS errors**: Wait for Let's Encrypt certificate (30-60 min after DNS setup)
- **404 on custom domain**: Check `public/CNAME` file is being deployed to `dist/`
- **DNS not propagating**: Can take up to 48 hours (usually 1 hour)

### Sound Not Playing
- Check files exist in `public/sounds/`
- Check browser console for file not found errors
- Verify file names match exactly (move.mp3, capture.mp3, etc.)
- Check browser autoplay policy (sounds triggered by user actions should work)
- Mute button working? Check localStorage `thin-chess-muted` value

---

## Resources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

---

## License

MIT © James Trafny

**Questions?** Open an issue on GitHub.
