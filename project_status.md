# 1-D Chess & Thin Chess — Project Status

**Status: ✅ PRODUCTION READY**
_Last updated: 2025-10-25_

## 1) Overview
This project features minimalist chess variants with **9 curated game modes** organized into 2 categories:
- **1-D Chess (1×N)**: Single-file chess variant with perfect-play solver (2 modes)
- **Minichess Classics (M×N)**: Historic minichess variants on compact boards (4 modes: Los Alamos, Gardner, QuickChess, Elena/Sirotkin)

All game modes are **configuration-driven** via `public/game-modes.json` - no code changes needed to add/modify modes.

Deployed at **[thinchess.com](https://thinchess.com)** (also available at [jmtrafny.github.io](https://jmtrafny.github.io)).

## 2) Current Implementation

**Stack:**
- **React 19** + **TypeScript** + **Vite 7** (~1500 total LOC)
- **Vanilla CSS** with CSS custom properties (dark theme with gradient background)
- **GitHub Pages** deployment via GitHub Actions
- **PWA** with service worker and manifest.json

**Features Implemented:**

### Core Game Engine
- ✅ Interactive boards for both variants with legal move highlighting
- ✅ JSON-based game mode configuration (no hardcoded modes in code)
- ✅ Two game modes: 1-player (vs AI) and 2-player (local)
- ✅ Automatic game over detection (stalemate/checkmate) with visual banner
- ✅ Draw by repetition detection and claim button
- ✅ Resignation option with confirmation dialog
- ✅ Undo/Redo with full history management (2-step in 1-player mode)
- ✅ Position editor with load/copy functionality
- ✅ Responsive design optimized for mobile and desktop

### Configuration System
- ✅ **JSON-driven architecture**: All game modes defined in `public/game-modes.json`
- ✅ **Runtime validation**: Configuration validated on load with helpful error messages
- ✅ **Hot-reloadable**: Changes to JSON immediately reflected in UI
- ✅ **Type-safe**: Full TypeScript interfaces for configuration
- ✅ **Version tracking**: Configuration file includes semantic version
- ✅ **Category system**: Modes organized into categories with icons and descriptions
- ✅ **No code changes needed**: Add modes by editing JSON only

### 1-D Chess Specific
- ✅ Variable board lengths (6-12 squares supported)
- ✅ Perfect-play AI using tri-valued negamax solver with transposition table
- ✅ Instant position evaluation (WIN/LOSS/DRAW with depth)
- ✅ Cached solver results for repeated positions
- ✅ Pieces: Kings, Rooks, Knights (Q, B, P technically supported but untested)

### Thin Chess Specific
- ✅ Full 2D chess movement (King, Rook, Knight, Bishop, Pawn, Queen)
- ✅ Variable board dimensions (2×6 to 3×8 tested)
- ✅ Pawn promotion to any piece
- ✅ Diagonal queen movement on wider boards
- ✅ Random-move AI (game tree too large for perfect solver)

### Game Mode System
- ✅ **Category-based organization**: Modes grouped by type (1-D Chess, Thin Chess, Puzzles)
- ✅ **Rich metadata**: Each mode includes icon, difficulty, stars, description
- ✅ **Progressive hint system**: 3-level hints (Hint 1 → Hint 2 → Solution)
- ✅ **Strategic guidance**: Competitive modes include white/black plans
- ✅ **Learning objectives**: Educational goals for each mode
- ✅ **Solvability indicators**: FORCED_WIN_WHITE, COMPETITIVE, TACTICAL_PUZZLE, DRAWISH
- ✅ **Difficulty ratings**: 1-5 star system
- ✅ **Type badges**: Visual indicators (Beginner, Intermediate, Advanced)

### Audio & Visual
- ✅ Sound effects for moves, captures, and game outcomes
- ✅ Mute toggle with localStorage persistence
- ✅ SVG chess pieces (12 high-quality graphics with transparent backgrounds)
- ✅ Alternating checkerboard pattern for multi-file boards
- ✅ Coordinate labels for both variants

### PWA & Deployment
- ✅ PWA install button (appears when app is installable)
- ✅ Custom domain (thinchess.com) with HTTPS
- ✅ Open Graph meta tags for rich social media previews
- ✅ Fully offline-capable after first load
- ✅ Service worker with network-first strategy

**UI Design:**
- **Two-row header**:
  - Row 1: Game mode title (centered)
  - Row 2: Difficulty badge, YouTube link, sound toggle, install button (evenly spaced)
- **Central board** with coordinate labels
- **Move log sidebar** showing algebraic notation
- **Two-row controls**:
  - Row 1: New Game, Resign/Draw
  - Row 2: Undo, Redo
- **Position Editor** in collapsible details section
- **Modal dialogs** for category selection, mode selection, and help
- **Game-over banner** with restart option
- **Help modal** with progressive hint reveal system
- **Help icons** positioned on right side of mode cards (vertically centered)

**Default State:**
- Game starts with mode specified in `defaultGame` configuration
- Current default: 1-D Chess by ChessTraps, 1-player mode, player as white
- If `defaultGame` is not specified, falls back to first mode in configuration
- Configuration loaded from JSON on startup

## 3) Architecture Decisions

### Configuration-Driven Design
**Decision:** Move all game mode definitions from TypeScript arrays to JSON configuration file.

**Benefits:**
- ✅ No code changes needed to add/modify modes
- ✅ Non-developers can contribute modes
- ✅ Easier to maintain and version
- ✅ Configuration can be validated at runtime
- ✅ UI automatically adapts to configuration changes

**Implementation:**
- `public/game-modes.json` contains all mode definitions
- `src/config/loader.ts` loads and caches configuration
- `src/config/validator.ts` validates structure at runtime
- `src/hooks/useGameModes.ts` provides React hook for accessing modes
- UI components read from configuration, not hardcoded arrays

### Game Modes Configuration Schema

**File Structure:**
```json
{
  "version": "2.0.0",
  "defaultGame": {
    "modeId": "MODE_ID",
    "gameType": "1player" | "2player",
    "playerSide": "w" | "b"
  },
  "categories": [
    {
      "id": "category-id",
      "name": "Display Name",
      "description": "Category description",
      "icon": "🎮"
    }
  ],
  "modes": [
    {
      "id": "MODE_ID",
      "categoryId": "category-id",
      "name": "Mode Name",
      "description": "Short description",
      "variant": "1xN" | "NxM",
      "boardWidth": 1-6,
      "boardHeight": 5-12,
      "startPosition": "encoded-position",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "difficultyStars": 1-5,
      "icon": "🎯",
      "help": {
        "challenge": "Full description",
        "solvabilityType": "FORCED_WIN_WHITE" | "COMPETITIVE" | "TACTICAL_PUZZLE" | "DRAWISH",
        "hints": ["hint1", "hint2"],
        "solution": "solution text or null",
        "strategy": {
          "whitePlan": "Strategy for white",
          "blackPlan": "Strategy for black",
          "keyPositions": "Key positions to understand"
        } | null,
        "learningObjectives": ["objective1", "objective2"]
      }
    }
  ]
}
```

**Validation Rules:**
- Version must be semantic version string
- **defaultGame (optional):**
  - modeId must reference existing mode
  - gameType must be "1player" or "2player"
  - playerSide must be "w" or "b"
- All category IDs must be unique
- All mode IDs must be unique
- Mode categoryId must reference existing category
- Board dimensions must match variant type
- Position string must have correct number of squares
- Difficulty must be valid enum value
- Stars must be 1-5
- Help content must include required fields

### Multi-Variant System
**Decision:** Unified engine with variant parameter (`'1xN'` | `'NxM'`) supporting different board sizes.

**Rationale:** Code reuse for common logic (check detection, move application) while allowing variant-specific movement generation.

**Internal Naming (Code):**
- `'1xN'` = 1-D Chess (1×N boards)
- `'NxM'` = Minichess Classics (M×N boards)

**User-Facing Naming:**
- "1-D Chess" = Single-file chess variants
- "Minichess Classics" = Historic compact board variants

**Implementation:**
- `BoardConfig` interface defines dimensions for each mode
- `getConfig()` function extracts config from position metadata
- All engine functions accept `Position` with embedded variant field
- Position encoding/decoding handles both formats (comma-separated vs rank-separated)

### Thin Chess AI Strategy
**Problem:** Thin Chess (2×N) has exponentially larger game tree than 1-D Chess (1×N).

**Solution:** Random move selection for Thin Chess instead of perfect solver.

**Rationale:**
- Branching factor ~11 moves average in Thin Chess vs ~5 in 1-D Chess
- Depth-20 search hits max depth 47,549 times, freezing browser
- Random AI provides playable opponent for casual games and mode challenges

### Game Over Detection
**Decision:** Check for terminal state only when valid game mode is loaded.

**Critical Fix:** Added `!state.currentMode` check to prevent false stalemate detection on initial dummy position (1×1 empty board created before config loads).

**Prevents:** Draw sound playing on startup, incorrect game state on initial render.

### Sound Effect Management
**Decision:** Use refs to track last game result and prevent duplicate sound playback.

**Implementation:**
- `lastGameResultRef` stores previous result
- Ref is reset when new game starts (`!gameState.gameOver`)
- Prevents sound from playing multiple times for same result
- Prevents sound on initial load when transitioning from null → actual game

### Service Worker Strategy
**Problem:** Initial cache-first strategy caused stale cache issues (white screen on updates).

**Solution:** **Network First** for HTML/JS/CSS/JSON (always fetch fresh, cache as fallback) and **Cache First** for static assets (SVG, images).

**Cache versions:** `thin-chess-v2` and `thin-chess-static-v2`

**Dev mode:** Service worker disabled in development (`import.meta.env.PROD` check in main.tsx).

### State Management
- **React hooks** for all state (no Redux/context needed for this scale)
- **History management:** Array of encoded positions with index pointer for undo/redo
- **2-step undo/redo:** In 1-player mode, undo/redo moves 2 steps (player + AI) to maintain turn consistency
- **Configuration state:** Loaded once at startup, cached in memory
- **Modal state:** Centralized via `useModalState` hook
- **Game state:** Managed via `useGameState` hook with granular actions

## 4) Configurable Rule System (NEW)

The engine now supports **rule flags** that can be configured per game mode in `game-modes.json`. This enables:
- Standard chess rules (promotion, en passant, fifty-move, threefold)
- Custom knight models for 1D variants
- Castling scaffolding (for future implementation)

### Rule Flags

Each mode can specify:
```json
{
  "rules": {
    "promotion": true,         // Pawn promotion to Q/R/B/N (false = freeze on last rank)
    "enPassant": true,         // En passant captures
    "fiftyMoveRule": true,     // Draw after 100 plies
    "threefold": true,         // Draw on 3rd position repetition
    "castling": false,         // Castling (scaffolding only)
    "aiStrategy": "perfect"    // AI move selection: "perfect" | "aggressive" | "cooperative"
  }
}
```

**Default Behavior:** All flags default to `false` (or `"perfect"` for `aiStrategy`) if `rules` is omitted.

**AI Strategy Modes:**
- **`"perfect"`** (default): AI always plays optimally (WIN > DRAW > LOSS). Best for competitive modes where you want a challenging opponent.
- **`"aggressive"`**: AI avoids draws and takes risks (WIN > LOSS > DRAW). Keeps games dynamic by preferring to lose rather than draw.
- **`"cooperative"`**: AI only plays winning moves if found; otherwise plays randomly. Ideal for teaching/puzzle modes where the player should win with correct play.

**Position State:** Extended to track:
- `enPassantTarget`: Square index behind double-stepped pawn
- `halfmoveClock`: Plies since last capture/pawn move
- `castlingRights`: Bitmask (WK=1, WQ=2, BK=4, BQ=8)
- `positionHistory`: Map for threefold repetition detection

**Position Encoding:** Extended format `board:turn:ep:halfmove:castling`

### Implementation Status
- ✅ Promotion (Q/R/B/N or freeze on last rank)
- ✅ En passant (capture generation, EP target tracking, pawn removal)
- ✅ Fifty-move rule (clock tracking, auto-draw at 100 plies)
- ✅ Threefold repetition (position hashing, count tracking, auto-draw)
- ✅ AI Strategy (perfect/aggressive/cooperative move selection)
- ⏳ Castling (scaffolding in place, move generation TODO)

**Board-Agnostic:** All rules work on any NxM board size (1×8, 2×10, 3×5, etc.).

**Strategy Usage in Modes (1×N only):**
- **Cooperative AI** (1 teaching mode): 1D8_MONK
- **Perfect AI** (1 competitive mode): 1D12_CHESSTRAPS
- **Note:** All Minichess Classics (NxM) modes use random move selection regardless of aiStrategy setting

## 5) Base Rules (source of truth for engine)

### 1-D Chess (1×N)
- **Board**: 1 file of N ranks (6-12 supported)
- **Pieces**: `k`, `r`, `n` with side `w`/`b`
- **Moves**:
  - King moves ±1
  - Knight jumps ±2 (leaper; color-bound; ignores intervening squares)
  - Rook slides any distance ±1 direction (cannot jump)
- **Captures**: By displacement (all pieces)
- **Check/Checkmate**: Kings may not move into check; no legal moves in check = checkmate
- **Game end**: No legal moves → if in check = **checkmate** (win for opponent); else **stalemate** (draw)
- **Repetition**: Twofold repetition (position appears 2+ times) can be claimed as **draw** via UI button
- **Resignation**: Players can resign at any time with confirmation dialog

### Thin Chess (M×N)
- **Board**: M files × N ranks (2×6 to 3×8 tested)
- **Pieces**: `k`, `r`, `n`, `b`, `p`, `q` with side `w`/`b`
- **Moves**: Standard chess movement adapted to narrow boards
  - King: 8 directions (±1 orthogonal, ±1 diagonal)
  - Rook: Orthogonal sliding (up/down/left/right)
  - Knight: L-shape (2 in one direction, 1 perpendicular)
  - Bishop: Diagonal sliding (4 diagonal directions)
  - Pawn: Forward 1, captures diagonally forward, promotes on opposite rank
  - Queen: Combination of rook + bishop movement
- **Same rules**: Check, checkmate, stalemate, repetition, resignation

## 5) Position Encoding

### 1-D Chess (1×N)
- N comma-separated tokens, top→bottom
- Token set: `x` for empty; otherwise `[wb][krn]`
- Append the side to move as `:w` or `:b`
- Example (1×12): `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`
- **Internal representation:** `.` used for empty cells (converted from/to `x` in encode/decode)

### Thin Chess (M×N)
- Ranks separated by `/`, each rank has M cells separated by `,`
- Token set: `x` for empty; otherwise `[wb][krnbpq]`
- Append side to move as `:w` or `:b`
- Example (2×8): `x,bk/x,bb/x,x/x,x/wk,x/wr,x/x,x:w`
- **Board indexing**: Row-major (index = rank × width + file)

## 6) Files & Structure

```
jmtrafny.github.io/
├── src/
│   ├── engine.ts              # Multi-variant move generation, encoding, terminal detection
│   ├── solver.ts              # Tri-valued negamax with TT (used for 1-D Chess)
│   ├── audio.ts               # Sound effects management
│   ├── App.tsx                # Main React component (~650 lines)
│   ├── App.css                # Styling with variant-specific layouts (~800 lines)
│   ├── main.tsx               # React entry point, PWA service worker registration
│   ├── vite-env.d.ts          # TypeScript environment definitions
│   ├── config/
│   │   ├── GameModeConfig.ts  # TypeScript interfaces for configuration
│   │   ├── loader.ts          # Configuration loading and caching
│   │   └── validator.ts       # Runtime validation of configuration
│   ├── hooks/
│   │   ├── useGameModes.ts    # React hook for accessing game modes
│   │   ├── useGameState.ts    # Game state management hook
│   │   └── useModalState.ts   # Modal state management hook
│   └── components/
│       └── modals/            # Modal components (VariantPicker, ModePicker, HelpModal, etc.)
├── public/
│   ├── game-modes.json        # 🎯 Game mode configuration (all modes defined here)
│   ├── pieces/                # SVG chess piece graphics (12 files)
│   ├── svg/                   # UI icons (YouTube, restart, etc.)
│   ├── sounds/                # Sound effects (move, capture, victory, defeat, draw)
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── CNAME                  # Custom domain file (thinchess.com)
├── .github/workflows/
│   └── deploy.yml             # GitHub Actions deployment workflow
├── README.md                  # Project overview and usage
├── DEVELOPER.md               # Developer documentation (how to add modes)
├── GAME_MODES.md              # Technical reference for all modes
├── THIN_CHESS_MODES.md        # Player-facing mode documentation
├── project_status.md          # This file
├── index.html                 # HTML entry point with Open Graph meta tags
├── vite.config.ts             # Vite configuration
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

**Total codebase:** ~1500 lines of TypeScript/TSX/CSS (excluding config/deps)

## 7) Development Notes

### Running Locally
```bash
npm install
npm run dev        # Start dev server (http://localhost:5173)
```

### Building for Production
```bash
npm run build      # Creates dist/ directory (includes TypeScript check)
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

### Configuration System ✅
- ✅ JSON-based game mode definitions
- ✅ Runtime validation with helpful error messages
- ✅ Hot-reloadable configuration
- ✅ Type-safe interfaces
- ✅ Category-based organization
- ✅ Rich metadata support
- ✅ No code changes needed to add modes

### Game Mode Features ✅
- ✅ 12 curated modes across 3 categories
- ✅ Progressive hint system (3 levels)
- ✅ Full solutions with explanations
- ✅ Solvability indicators
- ✅ Learning objectives
- ✅ Difficulty ratings (1-5 stars)
- ✅ Type badges and icons
- ✅ In-app help modal

### UI/UX Improvements ✅
- ✅ Two-row header layout (title + buttons)
- ✅ Two-row controls layout (New/Resign + Undo/Redo)
- ✅ Consistent help icon positioning (right side, vertically centered)
- ✅ Sound effects with proper timing
- ✅ Responsive design for all screen sizes
- ✅ Default game on startup (1-D Chess: Full Set)

### Bug Fixes ✅
- ✅ Fixed draw sound playing on startup
- ✅ Fixed AI infinite loop issue
- ✅ Fixed position string validation errors
- ✅ Fixed game over detection on initial load
- ✅ Fixed help icon positioning in stacked layouts

### Future Enhancements (Stretch Goals)
- ⏳ Additional game modes (easy to add via JSON)
- ⏳ Opening trainer mode for 1-D Chess
- ⏳ Move animation
- ⏳ Position sharing via URL
- ⏳ Theme toggle (light/dark modes)
- ⏳ Export game notation (PGN-like format)

## 9) Technical Decisions Log

### Why configuration-driven architecture?
- Maximizes flexibility without code changes
- Enables non-developers to contribute modes
- Easier to maintain and version
- Type-safe with runtime validation
- Single source of truth for all mode data

### Why JSON instead of TypeScript for modes?
- Can be edited without rebuilding
- Non-developers can contribute
- Can be validated at runtime
- Easier to version and track changes
- Could potentially be loaded from API in future

### Why category-based organization?
- Better UX (logical grouping)
- Scalable (can add more categories)
- Flexible (modes can be reorganized)
- Clear mental model for users

### Why progressive hints?
- Reduces frustration (users don't get stuck)
- Encourages learning (reveal hints gradually)
- Maintains challenge (users can choose to solve without hints)
- Better UX than forcing users to search external documentation

### Why 12 modes instead of more?
- Quality over quantity (well-tested, interesting positions)
- Good difficulty curve (beginner → advanced)
- Not overwhelming for new players
- Easy to add more via JSON as needed

---

## For Future Contributors / Coding Agents

### Adding New Game Modes

**No code changes needed!** Simply edit `public/game-modes.json`:

1. ✅ Add new mode object to `modes` array
2. ✅ Ensure `categoryId` matches existing category
3. ✅ Provide valid position string for board dimensions
4. ✅ Include help content with hints, solution, learning objectives
5. ✅ Run `npm run build` to verify (validation will catch errors)
6. ✅ Test in browser (board renders, hints work)
7. ✅ Update `GAME_MODES.md` and `THIN_CHESS_MODES.md` documentation

**Example Mode:**
```json
{
  "id": "MY_NEW_MODE",
  "categoryId": "1d-chess",
  "name": "My Custom Mode",
  "description": "A brief description",
  "variant": "thin",
  "boardWidth": 1,
  "boardHeight": 8,
  "startPosition": "bk,br,bn,x,wn,wr,wk:w",
  "difficulty": "Intermediate",
  "difficultyStars": 3,
  "icon": "🎯",
  "help": {
    "challenge": "Full description of the challenge",
    "solvabilityType": "COMPETITIVE",
    "hints": ["Hint 1", "Hint 2"],
    "solution": "Detailed solution",
    "strategy": {
      "whitePlan": "What white should do",
      "blackPlan": "What black should do",
      "keyPositions": "Important positions"
    },
    "learningObjectives": [
      "What players will learn"
    ]
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

### Adding New Categories

Edit `categories` array in `public/game-modes.json`:

```json
{
  "id": "new-category",
  "name": "Display Name",
  "description": "Category description",
  "variant": "thin" | "skinny" | "mixed",
  "icon": "🎮"
}
```

Then add modes with `"categoryId": "new-category"`.

### Making Changes to Engine

- Edit `src/engine.ts` for game rules and movement logic
- `getConfig()` extracts board dimensions from position
- All functions accept variant parameter via Position object
- Test both variants after any engine changes
- Run `npm run build` to catch TypeScript errors

### Common Pitfalls

- ❌ **Don't change internal variant names** (`'thin'`/`'skinny'`) - breaks position encoding
- ❌ **Don't forget position string validation** - must match boardWidth × boardHeight
- ❌ **Don't skip testing both variants** after engine changes
- ❌ **Don't hardcode mode IDs in code** - use configuration system
- ❌ **Don't use cache-first for HTML/JS** - causes white screen on updates
- ✅ **Do update documentation** when adding modes
- ✅ **Do run build** to validate configuration
- ✅ **Do test on mobile** for responsive layout

### Configuration Validation

The validator checks:
- ✅ Version is semantic version string
- ✅ All category IDs are unique
- ✅ All mode IDs are unique
- ✅ Mode categoryId references exist
- ✅ Board dimensions match squares in position
- ✅ Difficulty is valid enum
- ✅ Stars are 1-5
- ✅ Required help fields present

Run `npm run build` - validation errors will show helpful messages.

---

**End of Project Status Document**
