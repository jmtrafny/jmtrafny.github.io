# Thin Chess - Developer Documentation

Technical documentation for contributors and developers.

---

## Architecture Overview

The project follows a clean separation of concerns:

```
src/
├── engine.ts      # Game rules and move generation
├── solver.ts      # Perfect-play solver with TT
├── App.tsx        # React UI component
├── App.css        # Styles
├── main.tsx       # Entry point + SW registration
├── engine.test.ts # Engine test suite
└── solver.test.ts # Solver test suite

public/
├── manifest.json  # PWA manifest
├── sw.js          # Service worker
└── chess.svg      # Favicon

.github/workflows/
└── deploy.yml     # GitHub Actions CI/CD
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

### `App.tsx`

**Responsibilities:**
- React component state management
- User interaction handlers
- Board rendering
- Move history (undo/redo)
- UI controls (buttons, position editor)

**State:**
```typescript
pos: Position           // Current position
history: string[]       // Position codes history
hIndex: number          // Current history index
sel: number | null      // Selected square
targets: number[]       // Legal target squares
statusText: string      // Status message
statusClass: string     // Status color class
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
- **Automatic**: Push to `main` triggers GitHub Actions workflow
- **Manual**: Run `npm run build:gh`, commit `dist/` (not recommended)

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
- **Strategy**: Cache-first with network fallback
- **Caches**: HTML, JS, CSS, manifest, icons
- **Versioning**: `CACHE_NAME` updated on changes
- **Cleanup**: Old caches deleted on activate

### Installation
- PWA installable on all modern browsers
- Works fully offline after first load
- Updates automatically when new version deployed

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
- Check base path in `vite.config.ts`
- Verify GitHub Pages source = "Actions"
- Check workflow run logs

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
