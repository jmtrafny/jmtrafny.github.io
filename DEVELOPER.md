# 1-D Chess & Thin Chess — Developer Guide

## Architecture Overview

This project implements chess variants in a single codebase using a **configuration-driven multi-variant architecture**:

- **1-D Chess (1×N)**: Single-file chess with variable board lengths (6-12 squares). Perfect-play solver.
- **Minichess (M×N)**: Multi-file narrow-board chess with variable dimensions (5×5, 5×6, 6×6, etc.). Random-move AI.
- **Configuration-driven**: All 9 game modes defined in JSON (`public/game-modes.json`), no hardcoded modes in TypeScript.

**Key Design Principles:**
- **Unified engine** with variant parameter for code reuse
- **Position object** embeds variant type (`'1xN'` | `'NxM'`) + optional dimensions
- **BoardConfig** system dynamically generates board dimensions
- **Fully generalized** - supports any board size and piece combination
- **Type-safe** TypeScript throughout

**Variant Type Names:**
```typescript
// Variant identifiers (used throughout codebase):
type VariantType = '1xN' | 'NxM';

// User-facing (UI):
'1xN' → "1-D Chess" (single file, N squares)
'NxM' → "Minichess Classics" (M×N compact boards)
```

**Why this matters:** Position encoding uses variant names. These must match exactly in JSON config and code.

---

## Core Modules

### `src/engine.ts` (~650 lines)

The multi-variant game engine handling move generation, position encoding, and game state.

#### Key Types

```typescript
export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p' | 'q';  // Added queen support
export type Piece = `${Side}${PieceType}`;  // e.g., 'wk', 'br', 'wq'
export type Cell = Piece | '.';             // '.' = empty (internal)
export type Board = Cell[];                 // Flat array of cells

export type VariantType = '1xN' | 'NxM';

export interface BoardConfig {
  variant: VariantType;
  width: number;     // 1 for 1xN, 2-N for NxM (dynamic)
  height: number;    // 6-12 for 1xN, 8-10 for NxM (dynamic)
  size: number;      // total squares (width × height)
  files: string[];   // ['a'] or ['a','b','c',...] (auto-generated)
  ranks: number[];   // [1..N] (auto-generated)
}

export interface Position {
  variant: VariantType;
  board: Board;
  turn: Side;
  boardLength?: number;  // Optional: custom height (1-D: 6-12, Thin: 8-10)
  boardWidth?: number;   // Optional: custom width (Thin Chess only: 2-5)
  enPassantTarget?: number;  // Square index behind pawn that just double-stepped
  halfmoveClock?: number;    // Plies since last capture/pawn move (fifty-move rule)
  castlingRights?: number;   // Bitmask: WK=1, WQ=2, BK=4, BQ=8
  positionHistory?: Map<string, number>;  // Position hash → count (threefold)
}

export interface Move {
  from: number;
  to: number;
  promotion?: PieceType;  // For pawn promotion
}

// Rule flags (from GameModeConfig)
export interface RuleSet {
  castling: boolean;
  enPassant: boolean;
  fiftyMoveRule: boolean;
  threefold: boolean;
  promotion: boolean;
}
```

#### Board Representation

**1-D Chess (1xN):**
- Single array of 12 cells: `board[0..11]`
- Index 0 = rank 12 (top), index 11 = rank 1 (bottom)
- Position encoding: `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`

**Thin Chess (NxM):**
- Single array of 20 cells: `board[0..19]` (row-major indexing)
- Rank 10 at indices 0-1, rank 1 at indices 18-19
- Position encoding: `x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w`

#### Core Functions

```typescript
// Position encoding/decoding (variant-aware, now includes rule state)
export function encode(pos: Position, includeExtendedFields?: boolean): string
export function decode(code: string, variant: VariantType): Position

// Move generation (rule-aware)
export function legalMoves(pos: Position, rules?: RuleSet): Move[]
export function applyMove(pos: Position, m: Move, rules?: RuleSet): Position

// Game state (rule-aware)
export function terminal(pos: Position, rules?: RuleSet): string | null
  // Returns: null | 'STALEMATE' | 'WHITE_MATE' | 'BLACK_MATE' | 'DRAW_FIFTY' | 'DRAW_THREEFOLD'
export function isCheck(pos: Position, rules?: RuleSet): boolean
export function detectRepetition(currentPos: Position, history: string[]): number

// Rule-specific helpers
export function isFiftyMoveDraw(pos: Position, rules?: RuleSet): boolean
export function isThreefoldDraw(pos: Position, rules?: RuleSet): boolean
export function positionHash(pos: Position): string  // For threefold detection

// Coordinate conversion (for 2D boards)
export function indexToCoords(idx: number, config: BoardConfig): [number, number]
export function coordsToIndex(rank: number, file: number, config: BoardConfig): number
export function indexToAlgebraic(idx: number, config: BoardConfig): string
```

#### Movement Logic

**1-D Chess (1xN):**
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

**Thin Chess (NxM):**
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

### Rule System Implementation

The engine supports configurable rule flags that modify game behavior. Each game mode can specify custom rules in `game-modes.json`.

#### RuleSet Interface

```typescript
export interface RuleSet {
  castling: boolean;        // Enable castling (scaffolding only - not fully implemented)
  enPassant: boolean;       // Enable en passant captures
  fiftyMoveRule: boolean;   // Draw after 100 plies without capture/pawn move
  threefold: boolean;       // Draw on 3rd position repetition
  promotion: boolean;       // Enable pawn promotion to Q/R/B/N
  aiStrategy?: AIStrategy;  // AI move selection strategy (optional, defaults to 'perfect')
}

export type AIStrategy = 'perfect' | 'aggressive' | 'cooperative';

export const DEFAULT_RULES: RuleSet = {
  castling: false,
  enPassant: false,
  fiftyMoveRule: false,
  threefold: false,
  promotion: false,
  // aiStrategy defaults to 'perfect' if omitted
};
```

#### Rule Implementation Details

**1. Promotion (`promotion: true`)**
- Generates 4 promotion moves (Q, R, B, N) when pawn reaches last rank
- When `false`: pawn can move to last rank but stays frozen (no further moves)
- Implemented in `legalMoves()` pawn move generation

**2. En Passant (`enPassant: true`)**
- Tracks `enPassantTarget` in Position (square *behind* double-stepped pawn)
- Generates diagonal EP capture moves when conditions met
- `applyMove()` removes captured pawn from EP target square
- Clears EP target after every move unless new double-step occurs

**3. Fifty-Move Rule (`fiftyMoveRule: true`)**
- Tracks `halfmoveClock` in Position
- Increments each ply, resets to 0 on captures or pawn moves
- `terminal()` returns `'DRAW_FIFTY'` when clock reaches 100
- Implemented in `applyMove()` and `isFiftyMoveDraw()`

**4. Threefold Repetition (`threefold: true`)**
- Tracks `positionHistory` Map<string, number> in Position
- `positionHash()` includes board, turn, EP target, castling rights
- `terminal()` returns `'DRAW_THREEFOLD'` on 3rd occurrence
- Implemented in `applyMove()` and `isThreefoldDraw()`

**5. AI Strategy (`aiStrategy: AIStrategy`)**
- Controls AI move selection in the solver (1-D Chess only)
- `"perfect"`: Optimal play (WIN > DRAW > LOSS) - default behavior
- `"aggressive"`: Avoids draws (WIN > LOSS > DRAW) - takes risks to win
- `"cooperative"`: Only wins if forced, otherwise random - for teaching puzzles
- Implemented in `solver.ts` at final move selection stage
- NxM variants use random moves regardless of strategy

**6. Castling (`castling: true`)** *(Scaffolding Only)*
- Tracks `castlingRights` bitmask: WK=1, WQ=2, BK=4, BQ=8
- Rights cleared when king/rook moves or rook captured
- Move generation not yet implemented (TODO in `legalMoves()`)

#### Position State Extensions

```typescript
// Extended position encoding format:
"board:turn:ep:halfmove:castling"

// Example:
"bk,br,bn,x,x,wn,wr,wk:w:-:0:0"
// ep = '-' (no EP target)
// halfmove = 0
// castling = 0 (no rights)
```

#### Integration Points

All engine functions accept optional `rules` parameter:

```typescript
const moves = legalMoves(position, rules);
const newPos = applyMove(position, move, rules);
const result = terminal(position, rules);
```

Game state hooks (`useGameState.ts`) extract rules from current mode:

```typescript
const rules = mode?.rules || DEFAULT_RULES;
```

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
const [gameVariant, setGameVariant] = useState<VariantType>('1xN');
const [showVariantPicker, setShowVariantPicker] = useState(true);
const [showModePicker, setShowModePicker] = useState(false);
const [selectedMode, setSelectedMode] = useState<SkinnyMode | null>(null);

// Help System
const [showHelpModal, setShowHelpModal] = useState(false);
const [helpMode, setHelpMode] = useState<string | null>(null);
const [hintLevel, setHintLevel] = useState(0);  // 0=none, 1=hint1, 2=hint2, 3=solution

// Game State
const [pos, setPos] = useState<Position>(() => decode(START_POSITIONS['1xN'], '1xN'));
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

    if (position.variant === 'NxM') {
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

#### Game Mode Configuration System

**All game modes are now defined in `public/game-modes.json`**, not in TypeScript code. This includes:

- Mode metadata (name, description, difficulty, icons)
- Starting positions and board dimensions
- Help content (hints, solutions, learning objectives)
- Rule flags (promotion, en passant, fifty-move rule, etc.)
- AI strategy settings

**Progressive Hint System** is implemented in the HelpModal component and reads data from the JSON configuration:

```typescript
// Help modal component reads from configuration
const mode = getMode(helpModeId);
const hints = mode.help.hints;
const solution = mode.help.solution;

// Renders hints progressively based on hintLevel state
{hintLevel >= 1 && <div className="hint-box">{hints[0]}</div>}
{hintLevel >= 2 && <div className="hint-box">{hints[1]}</div>}
{hintLevel >= 3 && <div className="solution-box"><pre>{solution}</pre></div>}
```

For adding or modifying game modes, see [ADDING_MODES.md](ADDING_MODES.md) - no code changes required!

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


### Adding a New Game Mode

**All game modes are now configuration-driven via JSON!** No code changes needed.

See **[ADDING_MODES.md](ADDING_MODES.md)** for the complete step-by-step guide.

**Quick Summary:**

1. Edit `public/game-modes.json`
2. Add new mode object to the `modes` array
3. Ensure `categoryId` matches an existing category
4. Provide valid position string for your board dimensions
5. Include complete help content (hints, solution, learning objectives)
6. Optionally configure rule flags (promotion, en passant, etc.)
7. Run `npm run build` to validate
8. Test in browser

**Minimal Example:**
```json
{
  "id": "MY_MODE_ID",
  "categoryId": "1d-chess",
  "name": "My Custom Mode",
  "description": "Brief description",
  "variant": "1xN",
  "boardWidth": 1,
  "boardHeight": 8,
  "startPosition": "bk,br,bn,x,wn,wr,wk:w",
  "difficulty": "Intermediate",
  "difficultyStars": 3,
  "icon": "🎯",
  "help": {
    "challenge": "Full description",
    "solvabilityType": "COMPETITIVE",
    "hints": ["Hint 1", "Hint 2"],
    "solution": null,
    "strategy": null,
    "learningObjectives": ["Learning goal"]
  },
  "rules": {
    "castling": false,
    "enPassant": false,
    "fiftyMoveRule": false,
    "threefold": false,
    "promotion": false,
    "aiStrategy": "perfect"
  }
}
```

---

### Supported Pieces Reference

| Piece | 1-D Movement | 2-D Movement | Notes |
|-------|-------------|-------------|-------|
| King (k) | ±1 | 8 directions | Cannot move into check |
| Rook (r) | Slides ±1 direction | Orthogonal slides | Long-range power |
| Knight (n) | Jumps ±2 | L-shape (2+1) | Can jump over pieces |
| Bishop (b) | N/A* | Diagonal slides | Color-bound in 2-D |
| Pawn (p) | N/A* | Forward + diagonal captures | Promotes on back rank |
| Queen (q) | N/A* | Rook + Bishop | Most powerful piece |

*Bishops, pawns, and queens are typically not used in 1-D Chess, but the engine supports them if needed.


### Changing Variant Names

**Variant identifiers must be consistent:**
- `type VariantType = '1xN' | 'NxM'` in TypeScript code
- `"variant": "1xN"` or `"variant": "NxM"` in game-modes.json
- All engine logic checks (`pos.variant === '1xN'`, etc.)
- Position encoding/decoding uses these exact strings

**Safe to change:**
- User-facing display strings in `App.tsx` (button labels, titles)
- Meta tags in `index.html`
- Documentation in `README.md`, `DEVELOPER.md`

**Example:**
```typescript
// ✅ Variant identifiers must match exactly
type VariantType = '1xN' | 'NxM';
if (gameVariant === '1xN') { ... }
"variant": "1xN"  // in JSON

// ✅ Display text can be customized
<button>Play 1-D Chess</button>
{gameVariant === '1xN' ? '1-D Chess' : 'Thin Chess'}
```


### Debugging Position Encoding Issues

**Problem:** Position doesn't load correctly

**Steps:**
1. Copy the position string from UI or code
2. Paste into browser console:
```javascript
import { decode } from './engine';
const pos = decode('x,bk/x,bb/.../wk,x:w', 'NxM');
console.log(pos);
```

3. Check:
   - Correct number of cells? (12 for 1xN, 20 for NxM)
   - Correct separator? (`,` for 1xN, `/` for NxM)
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
const thin1 = decode('bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w', '1xN');
const thinMoves = legalMoves(thin1);
console.log('1-D Chess moves:', thinMoves.length);  // Should be ~5-8

// Test Thin Chess
const skinny1 = decode('x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w', 'NxM');
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
