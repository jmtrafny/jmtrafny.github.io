/**
 * Chess Variants Engine - 1-D Chess (1×12) and Thin Chess (2×10)
 *
 * 1-D Chess Rules:
 * - Board: 1 file of 12 ranks (indexed 0..11, top→bottom)
 * - Pieces: k (king ±1), r (rook slides), n (knight jumps ±2)
 *
 * Thin Chess Rules:
 * - Board: 2 files of 10 ranks (2×10 grid, indexed row-major)
 * - Pieces: k (king 8-dir), r (rook orthogonal), n (knight L-shape), b (bishop diagonal), p (pawn)
 *
 * Common Rules:
 * - Kings cannot move into check
 * - No legal moves + check = checkmate
 * - No legal moves + no check = stalemate (draw)
 */

export type Side = 'w' | 'b';
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p';
export type Piece = `${Side}${PieceType}`;
export type Cell = Piece | '.';
export type Board = Cell[];

export type VariantType = 'thin' | 'skinny';

export interface BoardConfig {
  variant: VariantType;
  width: number;    // 1 for thin, 2 for skinny
  height: number;   // 12 for thin, 10 for skinny
  size: number;     // total squares
  files: string[];  // ['a'] or ['a','b']
  ranks: number[];  // [1..12] or [1..10]
}

export const CONFIGS: Record<VariantType, BoardConfig> = {
  thin: {
    variant: 'thin',
    width: 1,
    height: 12,
    size: 12,
    files: ['a'],
    ranks: Array.from({ length: 12 }, (_, i) => i + 1),
  },
  skinny: {
    variant: 'skinny',
    width: 2,
    height: 10,
    size: 20,
    files: ['a', 'b'],
    ranks: Array.from({ length: 10 }, (_, i) => i + 1),
  },
};

/**
 * Get board configuration for a position.
 * Handles variable board lengths for 1-D Chess modes.
 */
export function getConfig(pos: Position): BoardConfig {
  if (pos.variant === 'thin' && pos.boardLength && pos.boardLength !== 12) {
    // Custom 1-D Chess mode with non-standard length
    return {
      variant: 'thin',
      width: 1,
      height: pos.boardLength,
      size: pos.boardLength,
      files: ['a'],
      ranks: Array.from({ length: pos.boardLength }, (_, i) => i + 1),
    };
  }
  return CONFIGS[pos.variant];
}

export interface Position {
  variant: VariantType;
  board: Board;
  turn: Side;
  boardLength?: number; // Optional: for 1-D Chess modes with custom lengths (6, 7, 8, 10)
}

export interface Move {
  from: number;
  to: number;
  promotion?: PieceType; // For pawn promotion
}

export const EMPTY: Cell = '.';

// Unicode chess symbols
export const UNICODE: Record<Piece, string> = {
  wk: '\u2654',
  wr: '\u2656',
  wn: '\u2658',
  wb: '\u2657',
  wp: '\u2659',
  bk: '\u265A',
  br: '\u265C',
  bn: '\u265E',
  bb: '\u265D',
  bp: '\u265F',
};

// SVG piece images
export const PIECE_IMAGES: Record<Piece, string> = {
  wk: '/pieces/wk.svg',
  wr: '/pieces/wr.svg',
  wn: '/pieces/wn.svg',
  wb: '/pieces/wb.svg',
  wp: '/pieces/wp.svg',
  bk: '/pieces/bk.svg',
  br: '/pieces/br.svg',
  bn: '/pieces/bn.svg',
  bb: '/pieces/bb.svg',
  bp: '/pieces/bp.svg',
};

// Starting positions for each variant
export const START_POSITIONS: Record<VariantType, string> = {
  thin: 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
  skinny: 'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w',
};

// Backward compatibility: default starting position for Thin Chess
export const START_CODE = START_POSITIONS.thin;

/**
 * Skinny Chess Mode Pack
 * Curated starting positions for various strategic and tactical scenarios
 */
export interface SkinnyMode {
  id: string;
  name: string;
  description: string;
  startPosition: string;
  rationale: string;
  difficulty: 'Baseline' | 'Tactical' | 'Strategic' | 'Endgame' | 'Puzzle';
}

export const SKINNY_MODE_PACK: SkinnyMode[] = [
  {
    id: 'top-rank-guillotine',
    name: 'Top-Rank Guillotine',
    description: 'Beginner: Mate in 2-3 moves',
    startPosition: 'x,bk/x,x/x,x/x,x/x,x/x,x/wk,x/wr,x/x,x/x,x:w',
    rationale: 'Classic rook endgame teaching fundamental K+R vs K checkmating technique.',
    difficulty: 'Puzzle',
  },
  {
    id: 'mirror-towers',
    name: 'Mirror Towers',
    description: 'Standard opening - learn the basics',
    startPosition: 'x,bk/x,bb/x,bn/x,br/x,x/x,x/wr,x/wn,x/wb,x/wk,x:w',
    rationale: 'Essential baseline position for learning Skinny Chess opening theory and piece development.',
    difficulty: 'Baseline',
  },
  {
    id: 'pawn-corridors',
    name: 'Pawn Corridors',
    description: 'Promotion race - calculate tempo',
    startPosition: 'x,bk/x,bb/x,bn/x,br/x,x/x,bp/wp,x/wr,x/wn,x/wb,x/wk,x:w',
    rationale: 'White pawn on a7 ready to promote; tests tempo calculation and piece coordination.',
    difficulty: 'Tactical',
  },
  {
    id: 'bishop-duel',
    name: 'Bishop Duel',
    description: 'No knights - fortress warfare',
    startPosition: 'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,x:w',
    rationale: 'Pure color-complex strategy showcasing zugzwang and fortress positions.',
    difficulty: 'Strategic',
  },
  {
    id: 'flip-fork',
    name: 'Flip-Fork',
    description: 'Tactical puzzle - win material',
    startPosition: 'x,bk/x,bb/x,x/x,br/x,x/x,x/wr,x/x,x/wb,x/wk,wn:w',
    rationale: 'Knight fork pattern: exploit unusual knight position to win material in 3-4 moves.',
    difficulty: 'Puzzle',
  },
];

/**
 * 1-D Chess Mode Pack
 * Scenarios from "Interesting Starting Conditions for 1D Chess"
 */
export interface ThinMode {
  id: string;
  name: string;
  description: string;
  startPosition: string;
  boardLength: number;
  rationale: string;
  difficulty: 'Puzzle' | 'Classic' | 'Strategic' | 'Asymmetric';
}

export const THIN_MODE_PACK: ThinMode[] = [
  {
    id: 'original-1d-chess',
    name: 'Original 1-D Chess',
    description: 'Board length 12 - full classic setup',
    startPosition: 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
    boardLength: 12,
    rationale: 'Classic 12-square 1-D chess with full piece complement (2 knights, 2 rooks per side). Rich strategic depth.',
    difficulty: 'Classic',
  },
  {
    id: 'minimal-knights-duel',
    name: 'Minimal Knights Duel',
    description: 'Board length 6 - quick tactical battle',
    startPosition: 'wk,wn,x,x,bn,bk:w',
    boardLength: 6,
    rationale: 'Simple symmetric setup with one knight and one king each. Knights must maneuver carefully without leaving kings exposed.',
    difficulty: 'Puzzle',
  },
  {
    id: 'classic-1d-chess',
    name: 'Classic 1D Chess',
    description: 'Board length 8 - Martin Gardner variant',
    startPosition: 'wk,wn,wr,x,x,bn,br,bk:w',
    boardLength: 8,
    rationale: 'The classic one-dimensional chess described by Martin Gardner. White has a forced win with optimal play.',
    difficulty: 'Classic',
  },
  {
    id: 'multi-piece-battle',
    name: 'Multi-Piece Battle',
    description: 'Board length 10 - bishops included',
    startPosition: 'wk,wr,wn,wb,x,x,bb,bn,br,bk:w',
    boardLength: 10,
    rationale: 'Symmetric setup introducing bishops. Bishops move on same-color squares (parity), creating unique tactical opportunities.',
    difficulty: 'Strategic',
  },
  {
    id: 'asymmetric-challenge',
    name: 'Two Knights vs Rook',
    description: 'Board length 7 - unbalanced challenge',
    startPosition: 'wk,wn,wn,x,x,br,bk:w',
    boardLength: 7,
    rationale: 'White has two knights, Black has one rook. Asymmetric challenge testing piece coordination against long-range threats.',
    difficulty: 'Asymmetric',
  },
];

/**
 * Mode Help Content
 * Progressive hints and solutions for each mode
 */
export interface ModeHelp {
  challenge: string;
  solvabilityType: 'FORCED_WIN_WHITE' | 'TACTICAL_PUZZLE' | 'COMPETITIVE' | 'DRAWISH';
  hints: string[];
  solution?: string;
  strategy?: {
    whitePlan: string;
    blackPlan: string;
    keyPositions: string;
  };
  learningObjectives: string[];
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  icon: '🧩' | '⚖️' | '📚' | '🎯' | '👑';
}

export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {
  'top-rank-guillotine': {
    challenge: 'White has a rook and king versus a lone black king trapped near the top of the board. Your goal is to deliver checkmate in 2–3 moves using the classic rook+king checkmating technique.',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: [
      'The black king is already trapped on the b-file. Use your king and rook together to cut off escape squares.',
      'Bring your white king up the a-file to support the rook. The rook should control the b-file while the king approaches.',
    ],
    solution: '1. Kb2 – King steps up to support the rook. Black is forced to b9 or stays at b10.\n2. Rb3+ – Rook check drives king to the back rank. If 1…Kb9 then 2.Kb3 Ka10 3.Ra3#. If 1…Ka10 then 2.Ra3#.\n3. Checkmate – King and rook trap the black king.\n\nKey Concepts: Rook ladder, king support, edge checkmate.',
    learningObjectives: [
      'Master the fundamental K+R vs K checkmating technique',
      'Use the rook to cut off files',
      'Practice basic king opposition in endgames',
    ],
    difficultyStars: 1,
    icon: '🧩',
  },
  'mirror-towers': {
    challenge: 'The standard Skinny Chess opening position with all pieces vertically aligned on opposite files. This is a competitive game where you\'ll learn fundamental opening principles and piece development.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'Advance the rook early to control central ranks (5–6 range). Use knight to attack black\'s pieces from unexpected angles. Create threats that black\'s random moves may not address. Look for forks between king and other pieces.',
      blackPlan: 'Develop pieces quickly to active squares. Keep king safe from knight forks. Use bishop to control diagonal escape routes. Counter-attack when white overextends.',
      keyPositions: 'Rook on 5th rank often dominates the center. Knight on b-file can fork king+bishop. Bishop controls one color complex entirely.',
    },
    learningObjectives: [
      'Understand piece development in confined space',
      'Create and exploit tactical threats',
      'Practice planning 3–4 moves ahead',
      'Recognize fork patterns on a narrow board',
    ],
    difficultyStars: 3,
    icon: '📚',
  },
  'pawn-corridors': {
    challenge: 'Both sides have one pawn racing toward promotion (white pawn on a7, black pawn on b4). This tactical puzzle tests your ability to calculate promotion races while defending with pieces.',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'Count how many moves it takes each pawn to promote. Can you stop your opponent\'s pawn while advancing your own?',
      'Your rook on a-file can cut across to the b-file to blockade black\'s pawn. Meanwhile, your pawn only needs 1 move to promote from a7.',
    ],
    solution: '1. a8=R or a8=Q – Promote immediately. Black\'s pawn is only on b4 and needs several moves to promote.\n2. Use the new piece to support attack – With extra material, coordinate rook/queen with existing pieces.\n3. Stop black\'s pawn if it advances – Rook can shift to b-file (e.g., Ra8–Rb8 or Ra4–Rb4) after you secure promotion.\n\nKey Concepts: Pawn promotion, tempo calculation, piece coordination.',
    learningObjectives: [
      'Calculate promotion races accurately',
      'Understand tempo advantage',
      'Decide when to promote vs. when to defend',
    ],
    difficultyStars: 3,
    icon: '🎯',
  },
  'bishop-duel': {
    challenge: 'A strategic endgame with K+R+B versus K+R+B and no knights. This position explores color-complex warfare where each bishop controls only one color, creating fortress and zugzwang possibilities.',
    solvabilityType: 'DRAWISH',
    hints: [],
    strategy: {
      whitePlan: 'Activate your rook to the 7th rank if possible. Use bishop to control key squares your opponent\'s bishop cannot. Create threats on squares matching your bishop\'s color. Hunt for zugzwang positions that force concessions.',
      blackPlan: 'Establish a defensive fortress with bishop controlling critical squares. Keep rook active; trade if white\'s rook invades. Maintain king centralization. Avoid self-blockades.',
      keyPositions: 'Bishop blockades on promotion squares. Rook on the 7th rank with bishop support = dangerous. King+bishop battery controlling the key color complex.',
    },
    learningObjectives: [
      'Manage color-complex strategy (opposite-color bishops)',
      'Build and break fortresses',
      'Recognize zugzwang patterns',
      'Practice patient maneuvering',
    ],
    difficultyStars: 4,
    icon: '👑',
  },
  'flip-fork': {
    challenge: 'White has an unusual knight position at b1. Your goal is to exploit this knight\'s mobility to win material through a tactical fork sequence within 3–4 moves.',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'Knights are most powerful when they can attack multiple pieces from a central square. Where can your knight jump to threaten two pieces at once?',
      'Look at the knight move Na3 or Nd2. From these squares, can the knight reach a fork position attacking king and bishop/rook?',
    ],
    solution: '1. Na3 – Knight jumps to a3, eyeing Nb5. If …Kb9 (or any waiting move)\n2. Nb5 – Fork! Knight attacks both king on b10 and bishop on b9.\n3. …Ka8/Ka10 – King must move.\n4. N×(target) – Capture the bishop (or rook) and convert the material edge.\n\nAlternative: 1.Nd2 aiming for Nc4–Ne5 fork motifs.\n\nKey Concepts: Knight forks, forcing moves, double attacks.',
    learningObjectives: [
      'Spot and execute knight-fork tactics',
      'Calculate forcing sequences',
      'Understand knight mobility on a narrow board',
    ],
    difficultyStars: 3,
    icon: '🧩',
  },
  // 1-D Chess Mode Help Content
  'original-1d-chess': {
    challenge: 'The original 12-square 1-D Chess setup with a full complement of pieces: 2 rooks, 2 knights, and 1 king per side. This is a rich strategic battle with multiple piece types and complex tactical possibilities.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'Coordinate your pieces to control key central squares (positions 5-7). Use knights to create forks and tactical threats. Rooks should work together to control long files. Look for opportunities to trap the enemy king between your pieces.',
      blackPlan: 'Mirror white\'s development with symmetrical piece placement. Counter white\'s tactical threats by maintaining piece coordination. Look for trades that simplify to favorable endgames. Use knights to harass white\'s king while keeping your own king safe.',
      keyPositions: 'Central control (squares 5-7) is critical. Knight on square 6 can fork multiple pieces. Rook pairs dominate open lines. King safety is paramount - avoid exposing your king to combined attacks.',
    },
    learningObjectives: [
      'Master multi-piece coordination in 1D',
      'Understand rook and knight synergy',
      'Practice long-term strategic planning',
      'Learn endgame transitions with multiple pieces',
    ],
    difficultyStars: 4,
    icon: '📚',
  },
  'minimal-knights-duel': {
    challenge: 'A quick tactical battle on a 6-square board. Each side has one king and one knight. Knights must maneuver carefully to attack the opposing king without leaving their own king exposed.',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'Knights need a 2-square jump and cannot attack adjacent squares. Your knight at position 1 can jump to positions 3 or beyond.',
      'Try to use your knight to control the center while keeping your king safe. Look for ways to check the enemy king while maintaining defense.',
    ],
    solution: 'This is a non-trivial tactical puzzle. With perfect play, one side may force a win through precise knight maneuvers. The key is to use your knight to restrict the enemy king\'s movement while advancing your own king into attacking position.\n\nKey Concepts: Knight coordination, king safety, tempo advantage.',
    learningObjectives: [
      'Understand knight movement in 1D (jumps ±2)',
      'Practice king and knight coordination',
      'Learn minimal material endgame technique',
    ],
    difficultyStars: 2,
    icon: '🎯',
  },
  'classic-1d-chess': {
    challenge: 'The classic one-dimensional chess variant described by Martin Gardner. Each side has a king, a knight, and a rook on an 8-square board. It has been proven that White has a forced win with optimal play.',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: [],
    strategy: {
      whitePlan: 'Use your rook to control long-range squares and your knight to create tactical threats. Coordinate both pieces to deliver checkmate. The rook should cut off escape squares while the knight delivers checks.',
      blackPlan: 'Try to trade pieces to reach a drawn endgame (e.g., K+N vs K is a draw). Defend actively and look for stalemate opportunities if you can eliminate white\'s attacking pieces.',
      keyPositions: 'Rook on central squares (positions 3-4) dominates the board. Knight forks between king and rook can win material. King must stay protected from combined rook+knight attacks.',
    },
    learningObjectives: [
      'Master the classic 1D chess position',
      'Practice rook and knight coordination',
      'Understand forced win techniques',
      'Learn piece trading strategies',
    ],
    difficultyStars: 3,
    icon: '📚',
  },
  'multi-piece-battle': {
    challenge: 'A complex 10-square battle introducing bishops to 1D chess. Bishops move every other square (staying on the same "color" parity), creating unique tactical opportunities. Both sides have king, rook, knight, and bishop.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'Use your bishop to control one parity of squares (odd or even positions). Coordinate rook for long-range attacks and knight for tactical jumps. Create threats on both parities that black cannot defend simultaneously.',
      blackPlan: 'Develop pieces to active squares quickly. Use your bishop to blockade white\'s bishop. Look for tactical opportunities with knight forks. Keep king centralized and protected.',
      keyPositions: 'Bishops on opposite parities can never capture each other. Rook on position 5 (center) controls both sides. Knight can exploit weak squares the bishop cannot defend.',
    },
    learningObjectives: [
      'Understand bishop movement in 1D (jumps ±2 on same parity)',
      'Manage opposite-parity bishop positions',
      'Coordinate multiple piece types',
      'Practice complex tactical calculations',
    ],
    difficultyStars: 4,
    icon: '👑',
  },
  'asymmetric-challenge': {
    challenge: 'An unbalanced 7-square battle: White has two knights while Black has one rook. White\'s knights must work together to corner the black king or rook, while Black uses the rook\'s long range to pick off knights from a distance.',
    solvabilityType: 'COMPETITIVE',
    hints: [
      'Two knights can create a fork pattern where one knight attacks the king while the other controls escape squares. Coordinate your knights to approach from different distances.',
      'Black\'s rook can control an entire line if unobstructed. Try to keep both knights protected from long-range rook attacks while advancing.',
    ],
    solution: 'This is a balanced handicap match. White should coordinate both knights to create double threats, while Black must use the rook\'s range to maintain distance.\n\nWhite Strategy: Advance knights together (one at position N, one at N+2 or N-2) to create fork opportunities. Trap the rook or deliver checkmate through knight coordination.\n\nBlack Strategy: Keep rook active on open lines. Pick off exposed knights. Maintain king safety by keeping the rook between king and enemy knights.\n\nKey Concepts: Material imbalance, piece coordination, long-range vs short-range tactics.',
    learningObjectives: [
      'Handle material imbalance situations',
      'Coordinate two knights effectively',
      'Defend against multiple attackers with one piece',
      'Understand positional compensation',
    ],
    difficultyStars: 3,
    icon: '⚖️',
  },
};

/**
 * Coordinate conversion functions for 2D board support
 */

// Convert flat index to 2D coordinates (rank, file)
export function indexToCoords(idx: number, config: BoardConfig): [number, number] {
  const rank = Math.floor(idx / config.width);
  const file = idx % config.width;
  return [rank, file];
}

// Convert 2D coordinates to flat index
export function coordsToIndex(rank: number, file: number, config: BoardConfig): number {
  return rank * config.width + file;
}

// Check if 2D coordinates are in bounds
export function inBounds2D(rank: number, file: number, config: BoardConfig): boolean {
  return rank >= 0 && rank < config.height && file >= 0 && file < config.width;
}

// Convert coordinates to algebraic notation
export function coordsToAlgebraic(rank: number, file: number, config: BoardConfig): string {
  return config.files[file] + (rank + 1);
}

/**
 * Position encoding/decoding
 * Thin format:  "cell,cell,...,cell:side" (comma-separated, flat)
 * Skinny format: "c,c/c,c/.../c,c:side" (ranks separated by /, cells by comma)
 * cell = 'x' (empty) or '[wb][krnbp]' (piece)
 * side = 'w' or 'b'
 */
export function decode(code: string, variant: VariantType, boardLength?: number): Position {
  // Determine config - use custom length for 1-D Chess modes if provided
  let config: BoardConfig;
  if (variant === 'thin' && boardLength && boardLength !== 12) {
    config = {
      variant: 'thin',
      width: 1,
      height: boardLength,
      size: boardLength,
      files: ['a'],
      ranks: Array.from({ length: boardLength }, (_, i) => i + 1),
    };
  } else {
    config = CONFIGS[variant];
  }

  const [cellsRaw, turnRaw] = code.trim().split(':');

  let items: string[];
  if (variant === 'thin') {
    // Thin: flat comma-separated
    items = cellsRaw.split(',').map(s => s.trim());
  } else {
    // Skinny: ranks separated by '/', cells by ','
    const ranks = cellsRaw.split('/');
    items = ranks.flatMap(rank => rank.split(',').map(s => s.trim()));
  }

  if (items.length !== config.size) {
    throw new Error(`Expected ${config.size} squares for ${variant}, got ${items.length}`);
  }

  const board: Board = items.map(s => {
    if (s === 'x') return EMPTY;
    if (!/^[wb][krnbp]$/.test(s)) throw new Error(`Bad token: ${s}`);
    return s as Piece;
  });

  const turn: Side = (turnRaw || 'w').trim() === 'b' ? 'b' : 'w';

  return { variant, board, turn, boardLength };
}

export function encode(pos: Position): string {
  const config = getConfig(pos);
  const cells = pos.board.map(p => p === EMPTY ? 'x' : p);

  let cellsStr: string;
  if (pos.variant === 'thin') {
    // Thin: flat comma-separated
    cellsStr = cells.join(',');
  } else {
    // Skinny: group by ranks, separate with '/'
    const ranks: string[] = [];
    for (let r = 0; r < config.height; r++) {
      const start = r * config.width;
      const end = start + config.width;
      const rankCells = cells.slice(start, end).join(',');
      ranks.push(rankCells);
    }
    cellsStr = ranks.join('/');
  }

  return `${cellsStr}:${pos.turn}`;
}

/**
 * Helper functions
 */
export function inBounds(i: number, config: BoardConfig): boolean {
  return i >= 0 && i < config.size;
}

export function sideOf(piece: Cell): Side | null {
  if (!piece || piece === EMPTY) return null;
  return piece[0] as Side;
}

export function typeOf(piece: Cell): PieceType | null {
  if (!piece || piece === EMPTY) return null;
  return piece[1] as PieceType;
}

export function findKing(board: Board, side: Side, config: BoardConfig): number {
  const king: Piece = `${side}k`;
  for (let i = 0; i < config.size; i++) {
    if (board[i] === king) return i;
  }
  return -1;
}

/**
 * Attack detection: Is square idx attacked by opponent?
 */
export function attacked(board: Board, side: Side, idx: number, config: BoardConfig): boolean {
  const opp: Side = side === 'w' ? 'b' : 'w';
  const [rank, file] = indexToCoords(idx, config);

  if (config.variant === 'thin') {
    // Thin Chess: 1D attacks
    // Opponent king ±1
    for (const d of [-1, 1]) {
      const j = idx + d;
      if (inBounds(j, config) && board[j] === `${opp}k`) return true;
    }

    // Opponent knight ±2
    for (const d of [-2, 2]) {
      const j = idx + d;
      if (inBounds(j, config) && board[j] === `${opp}n`) return true;
    }

    // Opponent rook (sliding rays)
    for (const d of [-1, 1]) {
      let j = idx + d;
      while (inBounds(j, config)) {
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}r`) return true;
          break;
        }
        j += d;
      }
    }
  } else {
    // Skinny Chess: 2D attacks
    // King attacks (8 directions)
    const kingDeltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, df] of kingDeltas) {
      const newRank = rank + dr;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}k`) return true;
      }
    }

    // Knight attacks (L-shapes)
    const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, df] of knightDeltas) {
      const newRank = rank + dr;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}n`) return true;
      }
    }

    // Rook attacks (orthogonal rays)
    const rookDeltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, df] of rookDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}r`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Bishop attacks (diagonal rays)
    const bishopDeltas = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, df] of bishopDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}b`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Pawn attacks (diagonal forward)
    const pawnDirection = side === 'w' ? 1 : -1;
    for (const df of [-1, 1]) {
      const newRank = rank + pawnDirection;
      const newFile = file + df;
      if (inBounds2D(newRank, newFile, config)) {
        const j = coordsToIndex(newRank, newFile, config);
        if (board[j] === `${opp}p`) return true;
      }
    }
  }

  return false;
}

/**
 * Generate all legal moves for current position
 */
export function legalMoves(pos: Position): Move[] {
  const { board, turn, variant } = pos;
  const config = getConfig(pos);
  const moves: Move[] = [];

  for (let i = 0; i < config.size; i++) {
    const p = board[i];
    if (p === EMPTY) continue;
    if (sideOf(p) !== turn) continue;

    const t = typeOf(p);
    let pieceMoves: Move[] = [];

    if (variant === 'thin') {
      // Thin Chess: 1D movement
      if (t === 'k') {
        // King moves ±1
        for (const d of [-1, 1]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'n') {
        // Knight jumps ±2
        for (const d of [-2, 2]) {
          const j = i + d;
          if (!inBounds(j, config)) continue;
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'r') {
        // Rook slides ±1 direction
        for (const d of [-1, 1]) {
          let j = i + d;
          while (inBounds(j, config)) {
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            j += d;
          }
        }
      }
    } else {
      // Skinny Chess: 2D movement
      const [rank, file] = indexToCoords(i, config);

      if (t === 'k') {
        // King: 8 directions
        const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, df] of deltas) {
          const newRank = rank + dr;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'n') {
        // Knight: L-shapes
        const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, df] of deltas) {
          const newRank = rank + dr;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) === turn) continue;
          pieceMoves.push({ from: i, to: j });
        }
      } else if (t === 'r') {
        // Rook: orthogonal sliding
        const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, df] of deltas) {
          let r = rank + dr;
          let f = file + df;
          while (inBounds2D(r, f, config)) {
            const j = coordsToIndex(r, f, config);
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            r += dr;
            f += df;
          }
        }
      } else if (t === 'b') {
        // Bishop: diagonal sliding
        const deltas = [[-1,-1],[-1,1],[1,-1],[1,1]];
        for (const [dr, df] of deltas) {
          let r = rank + dr;
          let f = file + df;
          while (inBounds2D(r, f, config)) {
            const j = coordsToIndex(r, f, config);
            const q = board[j];
            if (q === EMPTY) {
              pieceMoves.push({ from: i, to: j });
            } else {
              if (sideOf(q) !== turn) {
                pieceMoves.push({ from: i, to: j });
              }
              break;
            }
            r += dr;
            f += df;
          }
        }
      } else if (t === 'p') {
        // Pawn: forward + diagonal captures + promotion
        const direction = turn === 'w' ? 1 : -1;
        const startRank = turn === 'w' ? 1 : (config.height - 2);
        const promotionRank = turn === 'w' ? (config.height - 1) : 0;

        // Forward move
        const oneStep = rank + direction;
        if (inBounds2D(oneStep, file, config)) {
          const j = coordsToIndex(oneStep, file, config);
          if (board[j] === EMPTY) {
            if (oneStep === promotionRank) {
              // Promotion (default to queen for now)
              pieceMoves.push({ from: i, to: j, promotion: 'r' as PieceType });
            } else {
              pieceMoves.push({ from: i, to: j });
            }

            // Double move from starting position
            if (rank === startRank) {
              const twoStep = rank + 2 * direction;
              const j2 = coordsToIndex(twoStep, file, config);
              if (board[j2] === EMPTY) {
                pieceMoves.push({ from: i, to: j2 });
              }
            }
          }
        }

        // Diagonal captures
        for (const df of [-1, 1]) {
          const newRank = rank + direction;
          const newFile = file + df;
          if (!inBounds2D(newRank, newFile, config)) continue;
          const j = coordsToIndex(newRank, newFile, config);
          const q = board[j];
          if (q !== EMPTY && sideOf(q) !== turn) {
            if (newRank === promotionRank) {
              pieceMoves.push({ from: i, to: j, promotion: 'r' as PieceType });
            } else {
              pieceMoves.push({ from: i, to: j });
            }
          }
        }
      }
    }

    // Filter out moves that would leave king in check
    for (const m of pieceMoves) {
      if (!wouldExposeKing(m, board, turn, config)) {
        moves.push(m);
      }
    }
  }

  return moves;
}

function wouldExposeKing(m: Move, board: Board, turn: Side, config: BoardConfig): boolean {
  const nb = board.slice();
  nb[m.to] = nb[m.from];
  nb[m.from] = EMPTY;
  const kIdx = findKing(nb, turn, config);
  return attacked(nb, turn, kIdx, config);
}

/**
 * Apply a move and return new position
 */
export function applyMove(pos: Position, m: Move): Position {
  const nb = pos.board.slice();

  // Handle pawn promotion
  if (m.promotion) {
    const side = pos.turn;
    nb[m.to] = `${side}${m.promotion}` as Piece;
    nb[m.from] = EMPTY;
  } else {
    nb[m.to] = nb[m.from];
    nb[m.from] = EMPTY;
  }

  return {
    variant: pos.variant,
    board: nb,
    turn: pos.turn === 'w' ? 'b' : 'w',
    boardLength: pos.boardLength,
  };
}

/**
 * Check if current side is in check
 */
export function isCheck(pos: Position): boolean {
  const config = getConfig(pos);
  const kIdx = findKing(pos.board, pos.turn, config);
  return attacked(pos.board, pos.turn, kIdx, config);
}

/**
 * Terminal state detection
 * Returns: null (non-terminal) | 'STALEMATE' | 'WHITE_MATE' | 'BLACK_MATE'
 */
export function terminal(pos: Position): string | null {
  const moves = legalMoves(pos);
  if (moves.length > 0) return null; // non-terminal

  // No legal moves
  if (isCheck(pos)) {
    return pos.turn === 'w' ? 'WHITE_MATE' : 'BLACK_MATE';
  }

  return 'STALEMATE';
}

/**
 * Detect position repetition in history
 * Returns the count of how many times currentPos appears in history
 * Count >= 2 means twofold repetition (position repeated)
 */
export function detectRepetition(history: string[], currentPos: string): number {
  return history.filter(pos => pos === currentPos).length;
}
