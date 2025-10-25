# 1-D Chess & Thin Chess — Developer Guide

## Architecture Overview

This project implements two chess variants in a single codebase using a multi-variant architecture:

- **1-D Chess (1×12)**: Single-file chess with perfect-play solver
- **Thin Chess (2×10)**: 2-file chess with 5 curated challenges and progressive hints

**Key Design Principles:**
- **Unified engine** with variant parameter for code reuse
- **Position object** embeds variant type (`'thin'` | `'skinny'`)
- **BoardConfig** system abstracts board dimensions
- **Type-safe** TypeScript throughout

**Internal vs User-Facing Names:**
```typescript
// Internal (code):
type VariantType = 'thin' | 'skinny';  // Never change these!

// User-facing (UI):
'thin' → "1-D Chess"
'skinny' → "Thin Chess"
```

**Why this matters:** Position encoding uses internal names. Changing them breaks saved positions.

---

## Core Modules

### `src/engine.ts` (~650 lines)

The multi-variant game engine handling move generation, position encoding, and game state.

#### Key Types

```typescript
export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p';
export type Piece = `${Side}${PieceType}`;  // e.g., 'wk', 'br'
export type Cell = Piece | '.';             // '.' = empty (internal)
export type Board = Cell[];                 // Flat array of cells

export type VariantType = 'thin' | 'skinny';

export interface BoardConfig {
  variant: VariantType;
  width: number;     // 1 for thin, 2 for skinny
  height: number;    // 12 for thin, 10 for skinny
  size: number;      // total squares (width × height)
  files: string[];   // ['a'] or ['a','b']
  ranks: number[];   // [1..12] or [1..10]
}

export interface Position {
  variant: VariantType;
  board: Board;
  turn: Side;
}

export interface Move {
  from: number;
  to: number;
  promotion?: PieceType;  // For pawn promotion
}
```

#### Board Representation

**1-D Chess (thin):**
- Single array of 12 cells: `board[0..11]`
- Index 0 = rank 12 (top), index 11 = rank 1 (bottom)
- Position encoding: `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`

**Thin Chess (skinny):**
- Single array of 20 cells: `board[0..19]` (row-major indexing)
- Rank 10 at indices 0-1, rank 1 at indices 18-19
- Position encoding: `x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w`

#### Core Functions

```typescript
// Position encoding/decoding (variant-aware)
export function encode(pos: Position): string
export function decode(code: string, variant: VariantType): Position

// Move generation
export function legalMoves(pos: Position): Move[]
export function applyMove(pos: Position, m: Move): Position

// Game state
export function terminal(pos: Position): string | null  // null | 'STALEMATE' | 'WHITE_MATE' | 'BLACK_MATE'
export function isCheck(pos: Position): boolean
export function detectRepetition(currentPos: Position, history: string[]): number

// Coordinate conversion (for 2D boards)
export function indexToCoords(idx: number, config: BoardConfig): [number, number]
export function coordsToIndex(rank: number, file: number, config: BoardConfig): number
export function indexToAlgebraic(idx: number, config: BoardConfig): string
```

#### Movement Logic

**1-D Chess (thin):**
```typescript
// King: ±1
if (piece === 'k') {
  if (i - 1 >= 0) addMove(i, i - 1);
  if (i + 1 < 12) addMove(i, i + 1);
}

// Rook: slides until blocked
if (piece === 'r') {
  // Slide down
  for (let j = i + 1; j < 12; j++) {
    if (board[j] !== EMPTY) {
      if (sideOf(board[j]) !== turn) addMove(i, j);
      break;
    }
    addMove(i, j);
  }
  // Slide up (similar)
}

// Knight: jumps ±2
if (piece === 'n') {
  if (i - 2 >= 0) addMove(i, i - 2);
  if (i + 2 < 12) addMove(i, i + 2);
}
```

**Thin Chess (skinny):**
```typescript
// King: 8 directions
const kingDeltas = [[-1,0], [1,0], [0,-1], [0,1], [-1,-1], [-1,1], [1,-1], [1,1]];
for (const [dr, df] of kingDeltas) {
  const nr = rank + dr, nf = file + df;
  if (inBounds(nr, nf)) addMove(i, coordsToIndex(nr, nf));
}

// Rook: orthogonal sliding
const rookDirs = [[-1,0], [1,0], [0,-1], [0,1]];
for (const [dr, df] of rookDirs) {
  slideUntilBlocked(rank, file, dr, df);
}

// Knight: L-shape
const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
for (const [dr, df] of knightMoves) {
  const nr = rank + dr, nf = file + df;
  if (inBounds(nr, nf)) addMove(i, coordsToIndex(nr, nf));
}

// Bishop: diagonal sliding
const bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
for (const [dr, df] of bishopDirs) {
  slideUntilBlocked(rank, file, dr, df);
}

// Pawn: forward + diagonal captures + promotion
```

#### Check Detection

```typescript
export function attacked(board: Board, side: Side, idx: number, config: BoardConfig): boolean
```

Determines if square `idx` is attacked by `side`. Variant-aware logic:
- **1-D Chess:** Check ±1 for kings, ±2 for knights, sliding for rooks
- **Thin Chess:** Check all 8 king directions, knight L-shapes, rook/bishop slides, pawn diagonals

---

### `src/solver.ts` (~150 lines)

Perfect-play solver for **1-D Chess only** using tri-valued negamax.

**Not used for Thin Chess** (game tree too large, uses random AI instead).

#### Algorithm

```typescript
export interface SolveResult {
  res: 'WIN' | 'LOSS' | 'DRAW';
  depth: number;
  best?: Move;
}

export function solve(pos: Position, path: Set<string> = new Set(), depth = 0): SolveResult
```

**Key Features:**
- **Tri-valued:** Returns WIN/LOSS/DRAW (not numerical scores)
- **Transposition table:** Global `Map<string, SolveResult>` caches results
- **Cycle detection:** `path` set prevents infinite recursion on repetitions
- **Depth limit:** MAX_DEPTH = 50 to prevent stack overflow

**Logic:**
1. Check transposition table for cached result
2. Check for cycles (repetition = DRAW)
3. Check terminal state (checkmate/stalemate)
4. Try all legal moves recursively
5. If any move leads to opponent's LOSS → we have a WIN
6. If all moves lead to opponent's WIN → we have a LOSS
7. Otherwise → DRAW

**Example:**
```typescript
const result = solve(position);
// result.res === 'WIN' means current side can force a win
// result.best contains the best move to make
// result.depth is how many moves until forced outcome
```

---

### `src/audio.ts` (~60 lines)

Sound effect management with localStorage persistence.

```typescript
export function initAudio(): void
export function playMove(): void
export function playCapture(): void
export function playVictory(): void
export function playDefeat(): void
export function playDraw(): void
export function toggleMute(): boolean
export function getMuted(): boolean
```

**Implementation:**
- Preloads 5 MP3 files from `/sounds/`
- `muted` state stored in localStorage
- `initAudio()` called once on app mount

---

### `src/App.tsx` (~700 lines)

Main React component implementing the entire UI.

#### State Management

```typescript
// Variant & Mode
const [gameVariant, setGameVariant] = useState<VariantType>('thin');
const [showVariantPicker, setShowVariantPicker] = useState(true);
const [showModePicker, setShowModePicker] = useState(false);
const [selectedMode, setSelectedMode] = useState<SkinnyMode | null>(null);

// Help System
const [showHelpModal, setShowHelpModal] = useState(false);
const [helpMode, setHelpMode] = useState<string | null>(null);
const [hintLevel, setHintLevel] = useState(0);  // 0=none, 1=hint1, 2=hint2, 3=solution

// Game State
const [pos, setPos] = useState<Position>(() => decode(START_POSITIONS.thin, 'thin'));
const [history, setHistory] = useState<string[]>([...]);
const [hIndex, setHIndex] = useState(0);
const [sel, setSel] = useState<number | null>(null);
const [targets, setTargets] = useState<number[]>([]);
const [gameMode, setGameMode] = useState<GameMode | null>(null);
const [playerSide, setPlayerSide] = useState<Side | null>(null);
const [aiThinking, setAiThinking] = useState(false);
const [gameOver, setGameOver] = useState(false);
const [gameResult, setGameResult] = useState<string>('');
const [repetitionDetected, setRepetitionDetected] = useState(false);
```

#### Key Handlers

**AI Move (1-D Chess uses solver, Thin Chess uses random):**
```typescript
const makeAIMove = (position: Position) => {
  setAiThinking(true);
  setTimeout(() => {
    let bestMove: Move | undefined;

    if (position.variant === 'skinny') {
      // Thin Chess: random move
      const moves = legalMoves(position);
      if (moves.length > 0) {
        bestMove = moves[Math.floor(Math.random() * moves.length)];
      }
    } else {
      // 1-D Chess: perfect solver
      const result = solve(position);
      bestMove = result.best;
    }

    if (bestMove) {
      const newPos = applyMove(position, bestMove);
      setPos(newPos);
      // ... update history, play sounds
    }
    setAiThinking(false);
  }, 500);
};
```

**Square Click:**
```typescript
const handleSquareClick = (i: number) => {
  if (gameOver || aiThinking) return;

  // If nothing selected, try to select this piece
  if (sel === null) {
    if (/* piece belongs to current player */) {
      setSel(i);
      setTargets(legalMoves(pos).filter(m => m.from === i).map(m => m.to));
    }
  }
  // If this square is a target, make the move
  else if (targets.includes(i)) {
    const move = legalMoves(pos).find(m => m.from === sel && m.to === i);
    if (move) {
      pushPos(applyMove(pos, move));
      playMove() / playCapture();
    }
    setSel(null);
    setTargets([]);
  }
  // Clicking elsewhere deselects
  else {
    setSel(null);
    setTargets([]);
  }
};
```

**Undo/Redo:**
```typescript
const handleUndo = () => {
  if (hIndex > 0) {
    setHIndex(hIndex - 1);
    setPos(decode(history[hIndex - 1], pos.variant));
  }
};

const handleRedo = () => {
  if (hIndex < history.length - 1) {
    setHIndex(hIndex + 1);
    setPos(decode(history[hIndex + 1], pos.variant));
  }
};
```

#### Thin Chess Challenges System

**Mode Pack Data:**
```typescript
export const SKINNY_MODE_PACK: SkinnyMode[] = [
  {
    id: 'top-rank-guillotine',
    name: 'Top-Rank Guillotine',
    description: 'Beginner: Mate in 2-3 moves',
    startPosition: 'x,bk/x,x/x,x/x,x/x,x/x,x/wk,x/wr,x/x,x/x,x:w',
    difficulty: 'Puzzle',
  },
  // ... 4 more modes
];

export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {
  'top-rank-guillotine': {
    challenge: 'White has a rook and king versus a lone black king...',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: ['Hint 1 text', 'Hint 2 text'],
    solution: '1. Kb2 - King steps up...',
    learningObjectives: ['Master K+R vs K', 'Use rook to cut files'],
    difficultyStars: 1,
    icon: '🧩',
  },
  // ... other modes
};
```

**Progressive Hint System:**
```typescript
// Help modal shows hints progressively
{hintLevel === 0 && <button onClick={() => revealHint(1)}>Show Hint 1</button>}
{hintLevel >= 1 && <div className="hint-box">{MODE_HELP_CONTENT[helpMode].hints[0]}</div>}
{hintLevel >= 1 && <button onClick={() => revealHint(2)}>Show Hint 2</button>}
{hintLevel >= 2 && <div className="hint-box">{MODE_HELP_CONTENT[helpMode].hints[1]}</div>}
{hintLevel >= 2 && <button onClick={() => revealHint(3)}>Show Full Solution</button>}
{hintLevel >= 3 && <div className="solution-box"><pre>{solution}</pre></div>}
```

---

## Common Tasks

### Adding a New Piece Type to 1-D Chess

1. **Update type definitions** in `engine.ts`:
```typescript
export type PieceType = 'k' | 'r' | 'n' | 'q';  // Add 'q' for queen
```

2. **Add movement logic** in `legalMoves()`:
```typescript
if (piece === 'q') {
  // Queen moves like rook + bishop
  // Add sliding in all 4 directions
}
```

3. **Update UNICODE and PIECE_IMAGES**:
```typescript
export const UNICODE: Record<Piece, string> = {
  // ... existing
  wq: '\u2655',
  bq: '\u265B',
};

export const PIECE_IMAGES: Record<Piece, string> = {
  // ... existing
  wq: '/pieces/wq.svg',
  bq: '/pieces/bq.svg',
};
```

4. **Add attack logic** in `attacked()` function

5. **Add SVG assets** to `public/pieces/`

6. **Test** with position editor


### Adding a 2D Movement Pattern (Thin Chess)

Example: Adding a "Camel" piece that jumps (3,1) in L-shape:

```typescript
if (piece === 'c') {  // camel
  const camelMoves = [
    [-3, -1], [-3, 1], [-1, -3], [-1, 3],
    [1, -3], [1, 3], [3, -1], [3, 1]
  ];

  for (const [dr, df] of camelMoves) {
    const nr = rank + dr;
    const nf = file + df;
    if (nr >= 0 && nr < config.height && nf >= 0 && nf < config.width) {
      const target = coordsToIndex(nr, nf, config);
      const targetPiece = board[target];
      if (targetPiece === EMPTY || sideOf(targetPiece) !== turn) {
        moves.push({ from: i, to: target });
      }
    }
  }
}
```


### Adding a New Thin Chess Challenge Mode

1. **Design the position** - Create starting position string

2. **Add to SKINNY_MODE_PACK** in `engine.ts`:
```typescript
{
  id: 'my-new-challenge',
  name: 'My Challenge',
  description: 'Short description',
  startPosition: 'x,bk/x,bb/.../wk,x:w',
  rationale: 'Why this position is interesting',
  difficulty: 'Tactical',
}
```

3. **Add help content to MODE_HELP_CONTENT**:
```typescript
'my-new-challenge': {
  challenge: 'Explain the goal...',
  solvabilityType: 'TACTICAL_PUZZLE',
  hints: ['Subtle hint', 'Specific hint'],
  solution: '1. Move notation\n2. Explanation...',
  learningObjectives: ['What players learn'],
  difficultyStars: 3,
  icon: '🎯',
}
```

4. **Update THIN_CHESS_MODES.md** with full documentation

5. **Test the mode**:
   - Click "Thin Chess Challenges"
   - Select your mode
   - Verify position loads correctly
   - Test hint progression
   - Verify solution is accurate


### Changing Variant Names (User-Facing)

**Safe to change:**
- Strings in `App.tsx` (button labels, titles)
- Meta tags in `index.html`
- Documentation in `README.md`, `DEVELOPER.md`

**Never change:**
- `type VariantType = 'thin' | 'skinny'` (breaks position encoding!)
- Any hardcoded `'thin'` or `'skinny'` in engine logic

**Example:**
```typescript
// ✅ SAFE - user-facing text
<button>Play 1-D Chess</button>
{gameVariant === 'thin' ? '1-D Chess' : 'Thin Chess'}

// ❌ NEVER - internal variant identifier
type VariantType = 'onedimensional' | 'thinchess';  // BREAKS EVERYTHING
```


### Debugging Position Encoding Issues

**Problem:** Position doesn't load correctly

**Steps:**
1. Copy the position string from UI or code
2. Paste into browser console:
```javascript
import { decode } from './engine';
const pos = decode('x,bk/x,bb/.../wk,x:w', 'skinny');
console.log(pos);
```

3. Check:
   - Correct number of cells? (12 for thin, 20 for skinny)
   - Correct separator? (`,` for thin, `/` for skinny)
   - Valid pieces? (`[wb][krnbp]` or `x`)
   - Side to move? (`:w` or `:b`)

4. Common errors:
   - Missing `/` separators in Thin Chess positions
   - Wrong cell count (forgot a square)
   - Typo in piece names (`wB` instead of `wb`)


### Testing a Variant Change

Always test both variants after engine modifications:

```typescript
// Test 1-D Chess
const thin1 = decode('bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w', 'thin');
const thinMoves = legalMoves(thin1);
console.log('1-D Chess moves:', thinMoves.length);  // Should be ~5-8

// Test Thin Chess
const skinny1 = decode('x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w', 'skinny');
const skinnyMoves = legalMoves(skinny1);
console.log('Thin Chess moves:', skinnyMoves.length);  // Should be ~8-12
```


### Optimizing the Solver

**Problem:** Solver taking too long

**Solutions:**
1. **Increase transposition table effectiveness:**
```typescript
// Use canonical position representation (normalize turn/kings)
function canonical(pos: Position): string {
  // Flip board if black to move, always encode as white's perspective
}
```

2. **Add move ordering:**
```typescript
// Try captures first, then checks, then quiet moves
const moves = legalMoves(pos).sort((a, b) => {
  const aCapture = pos.board[a.to] !== EMPTY ? 1 : 0;
  const bCapture = pos.board[b.to] !== EMPTY ? 1 : 0;
  return bCapture - aCapture;  // Captures first
});
```

3. **Reduce depth limit** if positions are too complex

---

## Style Guide

### TypeScript Conventions
- **Explicit return types** on exported functions
- **No `any` types** - use proper typing or `unknown`
- **Interface over type** for objects with multiple fields
- **Type over interface** for unions/primitives

### React Conventions
- **Functional components** with hooks (no class components)
- **useState** for local state, **no global state** (Redux, Context)
- **useEffect** for side effects (AI moves, game-over detection)
- **Descriptive event handlers**: `handleSquareClick`, `handleUndo`

### CSS Conventions
- **CSS custom properties** for colors (`:root` variables)
- **BEM-like naming**: `.mode-card`, `.hint-btn`, `.solution-box`
- **No CSS-in-JS** - keep styles in `App.css`
- **Mobile-first** responsive design

---

## Architecture Decisions

### Why Not Separate Apps?
- **Code reuse:** 80% of logic is shared (check detection, move application, UI)
- **Single deployment:** One build, one domain
- **Unified UX:** Consistent controls and styling

### Why Not Use Chess.js Library?
- **Tiny codebase:** Custom engine is ~650 lines, chess.js is 4000+ lines
- **Non-standard variants:** Libraries don't support 1-D or 2×10 boards
- **Learning opportunity:** Full control over game logic

### Why Random AI for Thin Chess?
- **Performance:** Perfect solver would freeze browser for 30+ seconds per move
- **Good enough:** Random AI provides adequate challenge for casual play
- **Focus on puzzles:** Curated challenge modes are where serious play happens

### Why Progressive Hints?
- **Reduces frustration:** Users can get unstuck without spoiling the solution
- **Educational:** Users learn by revealing hints gradually
- **Better UX:** In-app help beats searching external docs

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test both variants
4. Commit with descriptive messages: `git commit -m "Add queen piece to 1-D Chess"`
5. Push and create a pull request

**Before submitting:**
- ✅ Run `npm run build` (no TypeScript errors)
- ✅ Test both 1-D Chess and Thin Chess
- ✅ Test challenge mode hint system (if applicable)
- ✅ Update documentation (README.md, DEVELOPER.md, THIN_CHESS_MODES.md)
- ✅ Follow existing code style

---

**Questions?** Open an issue or reach out to the maintainers.
