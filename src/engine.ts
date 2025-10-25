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
export type PieceType = 'k' | 'r' | 'n' | 'b' | 'p' | 'q';
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
 * Handles variable board dimensions for both variants.
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
  if (pos.variant === 'skinny' && (pos.boardWidth || pos.boardLength)) {
    // Custom Thin Chess mode with non-standard dimensions (e.g., 3×8)
    const width = pos.boardWidth || 2;
    const height = pos.boardLength || 10;
    const files = Array.from({ length: width }, (_, i) => String.fromCharCode(97 + i)); // 'a','b','c'...
    return {
      variant: 'skinny',
      width,
      height,
      size: width * height,
      files,
      ranks: Array.from({ length: height }, (_, i) => i + 1),
    };
  }
  return CONFIGS[pos.variant];
}

export interface Position {
  variant: VariantType;
  board: Board;
  turn: Side;
  boardLength?: number; // Optional: for custom board height (1-D: 6,7,8,9,10,12; Thin: 8,10,etc)
  boardWidth?: number;  // Optional: for custom board width (Thin Chess: 2 or 3)
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
  wq: '\u2655',
  wr: '\u2656',
  wn: '\u2658',
  wb: '\u2657',
  wp: '\u2659',
  bk: '\u265A',
  bq: '\u265B',
  br: '\u265C',
  bn: '\u265E',
  bb: '\u265D',
  bp: '\u265F',
};

// SVG piece images
export const PIECE_IMAGES: Record<Piece, string> = {
  wk: '/pieces/wk.svg',
  wq: '/pieces/wq.svg',
  wr: '/pieces/wr.svg',
  wn: '/pieces/wn.svg',
  wb: '/pieces/wb.svg',
  wp: '/pieces/wp.svg',
  bk: '/pieces/bk.svg',
  bq: '/pieces/bq.svg',
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  boardWidth: number;
  boardLength: number;
}

export const SKINNY_MODE_PACK: SkinnyMode[] = [
  {
    id: '2X8_KNIGHTS_TRENCH',
    name: "Knight's Trench",
    description: 'A trench-line battlefield with pawn blockades and knight maneuvering.',
    startPosition: 'bn,bk/bp,x/x,bp/x,x/x,x/x,x/wp,x/wn,wk:w',
    boardWidth: 2,
    boardLength: 8,
    rationale: 'Positional pawn warfare on 2 files. Knights maneuver around pawn structures.',
    difficulty: 'Beginner',
  },
  {
    id: '2X7_BISHOP_VS_KNIGHT',
    name: 'Bishop vs Knight Showdown',
    description: 'Asymmetric piece values challenge players to adapt their tactics.',
    startPosition: 'bk,br/x,bb/x,x/x,x/x,x/wn,x/wr,wk:w',
    boardWidth: 2,
    boardLength: 7,
    rationale: 'Asymmetric minor piece battle. Tests understanding of piece strengths.',
    difficulty: 'Intermediate',
  },
  {
    id: '3X6_COMPACT_BATTLE',
    name: 'Compact Battle',
    description: 'Three-file warfare with a complete piece ensemble packed into 18 squares.',
    startPosition: 'br,bk,bn/x,bb,x/x,x,x/wp,wn,x/wp,x,x/wr,wk,wb:w',
    boardWidth: 3,
    boardLength: 6,
    rationale: 'Complete chess compressed to 3×6. All piece types in minimal space.',
    difficulty: 'Advanced',
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const THIN_MODE_PACK: ThinMode[] = [
  {
    id: '1D12_CLASSIC',
    name: '1-D Chess: Full Set',
    description: 'Deep strategy in a single file. Knights and bishops vie for space.',
    startPosition: 'bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w',
    boardLength: 12,
    rationale: '12-square 1-D chess with full piece complement (2 knights, 2 rooks per side). Rich strategic depth.',
    difficulty: 'Intermediate',
  },
  {
    id: '1D10_TWIN_KNIGHTS',
    name: 'Twin Knights Siege',
    description: 'Double-knight tactics and tempo pressure. Highly tactical.',
    startPosition: 'bk,br,bn,bn,x,x,wn,wn,wr,wk:w',
    boardLength: 10,
    rationale: 'Fast knight tactics with rooks. Double-knight coordination is key.',
    difficulty: 'Intermediate',
  },
  {
    id: '1D8_ROOK_PAWN_ENDGAME',
    name: 'Rook & Pawn Endgame',
    description: 'Introductory tactical mode to learn rook vs king endgame concepts.',
    startPosition: 'bk,bp,x,x,x,wp,wr,wk:w',
    boardLength: 8,
    rationale: 'Simple rook endgame teaching fundamental patterns.',
    difficulty: 'Beginner',
  },
];

/**
 * Mini-Board Puzzles Pack
 * Small-board tactical/endgame puzzles across various dimensions
 */
export const MINI_BOARD_PUZZLES_PACK: Array<ThinMode | SkinnyMode> = [
  {
    id: '2X6_TOP_RANK_GUILLOTINE',
    name: 'Top-Rank Guillotine (2×6)',
    description: 'Fundamental K+R vs K ladder mate. Perfect for rook ladder training.',
    startPosition: 'x,bk/x,x/x,x/wk,x/wr,x/x,x:w',
    rationale: 'Short, clean execution of the fundamental rook-and-king mate.',
    difficulty: 'Beginner',
    boardWidth: 2,
    boardLength: 6
  },
  {
    id: '2X8_TOP_RANK_GUILLOTINE',
    name: 'Top-Rank Guillotine (2×8)',
    description: 'Extended version of rook ladder sequence. Slightly deeper than 2×6.',
    startPosition: 'x,bk/x,x/x,x/x,x/wk,x/wr,x/x,x:w',
    rationale: 'Same core technique as 2×6 with a longer staircase to build.',
    difficulty: 'Beginner',
    boardWidth: 2,
    boardLength: 8
  },
  {
    id: '2X8_BISHOP_CORRIDOR_SQUEEZE',
    name: 'Bishop Corridor Squeeze',
    description: 'A test of zugzwang entry and bishop maneuvering through fortress setups.',
    startPosition: 'x,bk/x,bb/x,x/x,x/wk,x/wr,x/x,x:w',
    rationale: 'Practice zugzwang entries and color-complex squeezes in two files.',
    difficulty: 'Intermediate',
    boardWidth: 2,
    boardLength: 8
  },
  {
    id: '2X8_FLIP_FORK_LITE',
    name: 'Flip-Fork Lite',
    description: 'Knight fork setup in a tight space. Fast tactical drill.',
    startPosition: 'x,bk/x,bb/x,x/x,br/x,x/wr,x/x,x/wk,wn:w',
    rationale: 'Teaches recognizing forcing knight jumps in cramped lanes.',
    difficulty: 'Intermediate',
    boardWidth: 2,
    boardLength: 8
  },
  {
    id: '3X8_THREE_FILE_SHOWDOWN',
    name: 'Three-File Showdown',
    description: 'Power vs numbers on a slightly broader battlefield. Queen tactics dominate.',
    startPosition: 'wk,x,x/wq,x,x/x,x,x/x,x,x/x,x,x/x,x,bn/x,br,x/bk,x,x:w',
    rationale: 'Power vs numbers with diagonals; orchestrate nets and pins.',
    difficulty: 'Advanced',
    boardWidth: 3,
    boardLength: 8
  },
  {
    id: '1X9_ROOK_RACE',
    name: 'Rook Race',
    description: 'A compressed power vs numbers battle. Knight fork threat at the center.',
    startPosition: 'wk,wr,x,x,x,x,bn,br,bk:w',
    rationale: 'Tradeoffs of raw power vs coordinated defenders in 1D.',
    difficulty: 'Intermediate',
    boardLength: 9
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
  icon: string;
}

export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {
  '2X6_TOP_RANK_GUILLOTINE': {
    challenge: 'A quick puzzle where White has a king and rook versus a lone black king trapped at the top of a 2-file board. The goal is to deliver checkmate in 2-3 moves using the fundamental rook-and-king mating technique. Methodically "guillotine" the black king against the top edge.',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: [
      'The black king is confined near rank 10. The rook forms a "ladder" on one file while the king boxes in the opposing king.',
      'The limited 2-column width makes the pattern clear: use the rook to cut off ranks and walk the enemy king to the board\'s edge.',
    ],
    solution: '1. Kb2 – King steps up to support. Black must stay on b-file or retreat to b9.\n2. Rb3+ – Rook check drives king to back rank.\n3. If ...Kb9 then Kb3 Ka10 Ra3#. If ...Ka10 then Ra3# immediately.\n\nKey Concepts: K+R vs K endgame, rook ladder technique, using king to cut off escape squares.',
    learningObjectives: [
      'Execute the fundamental K+R vs K checkmate with no distractions',
      'Use the rook to cut off ranks methodically',
      'Practice king opposition and zugzwang patterns',
    ],
    difficultyStars: 1,
    icon: '🧩',
  },
  '2X8_KNIGHTS_TRENCH': {
    challenge: 'The standard Thin Chess opening position - a mini-chess game on a 2×10 board. Each side has a king and a set of major/minor pieces vertically aligned on opposite files. White and Black begin in mirrored, balanced positions. White\'s objective is to outplay Black through superior development and tactics.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'The 2-column layout means pieces face each other almost immediately. Advance rook to control central ranks. Knights can create fork threats between the two files. Bishops dominate one color-complex. Coordinate all pieces without them blocking each other.',
      blackPlan: 'Mirror White\'s development initially but look for tactical opportunities. Keep king safe from knight forks. Use bishop to control squares White\'s bishop cannot. Counter-attack when White overextends.',
      keyPositions: 'Rook on 5th-7th rank controls board. Knight forks between files are deadly. Bishops on opposite colors create imbalanced positions. Any plan can be mirrored by opponent - test of strategic thinking.',
    },
    learningObjectives: [
      'Learn piece development in very confined space',
      'Coordinate pieces without them blocking each other',
      'Practice tactical awareness (forks, pins, skewers)',
      'Think 3-4 moves ahead on narrow front',
    ],
    difficultyStars: 3,
    icon: '📚',
  },
  '2X7_BISHOP_VS_KNIGHT': {
    challenge: 'A tactical puzzle where both sides have a single pawn racing on narrow "corridors" to reach the opposite end. White\'s pawn is far advanced (near a7), while Black\'s pawn is lower (at b4). Each side has pieces to aid their pawn or hinder the opponent. Win the race to the top!',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'This is all about tempo and calculation. Count moves: who promotes first if promotions were allowed? White\'s pawn needs fewer moves.',
      'The narrow board amplifies tension - limited paths mean a single rook or knight move can seal off a file or create an unblockable threat. Use pieces to interfere just in time.',
    ],
    solution: '1. a8=(promote) – White promotes immediately, gaining decisive advantage. Black\'s pawn at b4 needs 6 moves.\n2. Use newly promoted piece – Coordinate with existing pieces to stop Black\'s pawn.\n3. Block or capture Black\'s pawn – Shift rook to b-file (e.g., Ra8-Rb8) to blockade.\n\nKey Concepts: Tempo calculation, pawn races, piece interference, initiative.',
    learningObjectives: [
      'Practice counting moves in pawn races',
      'Use pieces to delay or block opponent pawns',
      'Understand initiative and tempo advantage',
      'Learn when reaching the last rank wins the race',
    ],
    difficultyStars: 3,
    icon: '🎯',
  },
  '3X6_COMPACT_BATTLE': {
    challenge: 'A balanced endgame duel featuring kings, rooks, and opposite-colored bishops for each side. With only two files, each bishop is permanently restricted to one color of squares. The starting position is symmetric, and the game often tends toward a tense drawish fight. Find a breakthrough or settle for a fortress!',
    solvabilityType: 'DRAWISH',
    hints: [],
    strategy: {
      whitePlan: 'This is less about quick tactics and more about planning and patience. Since each bishop can only influence half the squares, look for situations where you can establish a fortress on the color the opponent\'s bishop cannot touch. Coordinate rook and king to force zugzwang or penetrate vulnerable color squares. Activate rook to 7th rank with bishop support.',
      blackPlan: 'Maintain an active rook and solid blockade. Use bishop to control critical squares that White\'s bishop cannot reach. Look for fortress setups. Trade rooks if White invades. Keep king centralized.',
      keyPositions: 'Bishops on opposite colors can never capture each other. Rook on 7th rank with bishop support is dangerous. King+bishop battery controlling one color complex = strong fortress. Victory comes from understanding the delicate imbalance.',
    },
    learningObjectives: [
      'Understand opposite-color bishop endgames',
      'Build and maintain fortresses on narrow boards',
      'Recognize zugzwang and breakthrough patterns',
      'Practice patient positional maneuvering',
    ],
    difficultyStars: 4,
    icon: '👑',
  },
  '2X8_BISHOP_CORRIDOR_SQUEEZE': {
    challenge: 'Flip-Fork presents White with an unusual initial placement: a white knight that begins on Black\'s side of the board (at b1). This flipped knight is poised to wreak havoc if used creatively. The challenge goal is to win material via a knight fork in the first few moves.',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'The knight at b1 is almost in the "back door" of Black\'s position from the get-go, which is unusual and exciting. Look for a path where the knight can hop to fork the king and a loose piece.',
      'Knights can be devastating in cramped quarters where other pieces\' lines are easily blocked. The knight might jump to a3, then to b5 to fork the black king and bishop simultaneously.',
    ],
    solution: '1. Na3 – Knight jumps to a3, preparing fork.\n2. Nb5 – Fork! Attacks both king on b10 and bishop on b9 (or rook).\n3. ...Ka8 or Ka10 – King must move.\n4. Nxb9 (or Nxb7) – Capture piece, gaining decisive material edge.\n\nAlternative maneuvers possible. Key is spotting the fork pattern.\n\nKey Concepts: Knight forks, double attacks, unique movement in cramped spaces.',
    learningObjectives: [
      'Spot knight-fork tactical patterns',
      'Calculate forcing sequences with knights',
      'Maximize knight\'s reach on narrow boards',
      'Understand how knights excel when lines are blocked',
    ],
    difficultyStars: 3,
    icon: '🧩',
  },
  '3X8_THREE_FILE_SHOWDOWN': {
    challenge: 'This mode extends the power vs. numbers concept to a 3-file board (3×8). White has a king and a queen, while Black defends with a king, a rook, a knight, and a pawn as a shield. The queen on a 3×8 board wields tremendous power with diagonal tactics, but the confined width means it can still be cornered by clever defense.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'The queen vs rook+knight imbalance on a wider board means White can now exploit diagonal tactics. The queen can attack two files at once or approach from unexpected angles. Use the queen\'s power to orchestrate mating nets or fork two enemy pieces. Simultaneously pressure the knight and pin the rook behind its king.',
      blackPlan: 'Coordinate the rook and knight (with the pawn buying some time) to trap or trade off the white queen. The added file gives the knight more room to leap around and the rook more lateral freedom. Set up traps or pins on the third file. Perhaps sacrifice the pawn to distract the queen.',
      keyPositions: 'Queen\'s diagonal attacks across three files unlock new tactical patterns. Knight can force queen into corners while rook aims for white king. Pawn acts as buffer piece. Multi-piece coordination is critical.',
    },
    learningObjectives: [
      'Understand queen power on wider narrow boards',
      'Practice diagonal tactics (pins, skewers, forks)',
      'Coordinate multiple pieces against superior force',
      'Learn multi-piece cooperation patterns',
    ],
    difficultyStars: 4,
    icon: '⚖️',
  },
  // 1-D Chess Mode Help Content
  '1D12_CLASSIC': {
    challenge: 'The 12-square 1-D Chess setup with a full complement of pieces: 2 rooks, 2 knights, and 1 king per side. This is a rich strategic battle with multiple piece types and complex tactical possibilities.',
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
  '1D10_TWIN_KNIGHTS': {
    challenge: 'A simple symmetric endgame on a one-dimensional 6-square board. Each side has only a king and a knight, with kings at opposite ends and knights just inside them. Two empty squares separate the forces, preventing immediate contact. White moves first, and the goal is to maneuver your knight to checkmate the lone black king (or force its capture) without exposing your own king to the enemy knight.',
    solvabilityType: 'TACTICAL_PUZZLE',
    hints: [
      'This scenario distills chess to a tactical essence. With only knights (which jump two squares) in play, every move must be calculated precisely. There\'s a cat-and-mouse element: you try to get your knight in range to corner the enemy king while preventing the enemy knight from doing the same.',
      'The spacing ensures no piece can attack immediately, so it becomes a short maneuvering battle where first-move advantage and timing are critical. Despite minimal material, the solution is not trivial – one wrong jump can leave your king vulnerable.',
    ],
    solution: 'This is a non-trivial puzzle highlighting knight movement and king safety. With perfect play, White can leverage first-move advantage. Look for ways to use your knight to restrict the enemy king while advancing carefully.\n\nKey Concepts: Knight ±2 jumps, king safety, tempo, minimal material endgames.',
    learningObjectives: [
      'Understand knight movement in 1D (jumps ±2 squares)',
      'Practice king and knight coordination with minimal material',
      'Learn how first-move advantage and timing affect outcomes',
      'Master precision in tactical calculations',
    ],
    difficultyStars: 2,
    icon: '🎯',
  },
  '1D8_ROOK_PAWN_ENDGAME': {
    challenge: 'A fundamental one-dimensional chess setup. Each side has a king, a rook ("castle"), and a knight arrayed on an 8-square line. The armies are mirrored with two central empty squares ensuring neither side is in immediate check. White\'s objective is to coordinate the rook and knight to checkmate Black\'s king. Notably, White is known to have a forced win with perfect play.',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: [],
    strategy: {
      whitePlan: 'This scenario serves as a great baseline for 1D chess. It plays out like a mini chess game where you practice fundamental coordination: the knight\'s 2-square jumps and the rook\'s long-range moves complement each other. The challenge is strategic – you must plan how to use the rook for pressure and the knight for tricky forks.',
      blackPlan: 'Black\'s pieces mirror your own capabilities. Try to defend by trading pieces to reach a draw (king vs king stalemate). Defend actively and look for counter-opportunities.',
      keyPositions: 'Rook on central squares dominates. Knight forks are key tactical motifs. Despite being "solved" (its complexity has been compared to tic-tac-toe), it\'s instructive to discover the winning method. The fun comes from executing a checkmate with limited space and pieces, learning about piece parity and coordination in a stripped-down environment.',
    },
    learningObjectives: [
      'Master the classic 1D chess baseline position',
      'Practice fundamental rook and knight coordination',
      'Learn about piece parity and cooperation',
      'Understand forced win techniques in constrained spaces',
    ],
    difficultyStars: 3,
    icon: '📚',
  },
  '2X8_TOP_RANK_GUILLOTINE': {
    challenge: 'An intriguing imbalance scenario on a 9-square board. White has a lone rook (plus king) facing Black\'s rook and knight (plus king). On a 9-length single file, White essentially wields a powerful piece against Black\'s rook+knight team. There is ample space (four empty squares between armies) to maneuver, giving Black a fighting chance to coordinate defenses or counter-attacks.',
    solvabilityType: 'COMPETITIVE',
    hints: [],
    strategy: {
      whitePlan: 'This mode showcases the "power vs. numbers" trade-off. White\'s rook is powerful and can dominate open lines, but Black\'s combined forces have their own synergy: the knight\'s jumping ability can threaten the rook in ways a rook cannot, and together the rook and knight can cover each other\'s weaknesses. The challenge for White is largely strategic – you must leverage the rook\'s range to break through, while tactically avoiding fork tricks from the knight.',
      blackPlan: 'For Black (as the puzzle opponent or AI), the task is to coordinate the rook and knight to harass White\'s rook and delay mate. Use the knight to jump and threaten, while the rook provides long-range support.',
      keyPositions: 'This setup is engaging because it often boils down to whether raw power (rook) can overcome well-coordinated lesser pieces. It highlights the importance of piece cooperation and careful positioning on a narrow board where every move has immediate consequences.',
    },
    learningObjectives: [
      'Understand the power vs. numbers material imbalance',
      'Practice leveraging superior piece range',
      'Defend against or execute knight fork tactics',
      'Learn piece cooperation under pressure',
    ],
    difficultyStars: 3,
    icon: '⚖️',
  },
  '2X8_FLIP_FORK_LITE': {
    challenge: 'An asymmetric 1D battle on a 7-square board where White has two knights versus Black\'s single rook (each side has a king as well). The imbalance forces creative play. White\'s goal is to use the two knights in tandem to trap and checkmate Black\'s king or to capture the rook, while Black\'s rook will try to pick off the knights and avoid getting cornered. The black king starts behind the rook (at the far end), ensuring the rook isn\'t initially blocked.',
    solvabilityType: 'COMPETITIVE',
    hints: [
      'This mode plays out as a tense cat-and-mouse game. White\'s knights have strength in numbers and agility, able to threaten from different distances, while Black\'s rook has superior range and can strike from afar.',
      'Every move counts: if the knights coordinate, they can corner the rook or king; if they split up or miscalculate, the rook will systematically eliminate them. The asymmetry makes the scenario unpredictable and highly replayable.',
    ],
    solution: 'This is a balanced handicap match testing your ability to leverage mobility vs. power.\n\nWhite Strategy: Advance knights together, coordinating to create fork opportunities and trap the rook. Use one knight to restrict while the other attacks.\n\nBlack Strategy: Keep rook active. Use range to pick off exposed knights. Maintain king safety by keeping rook between king and enemy knights.\n\nKey Concepts: Material imbalance, two-piece coordination, long-range vs short-range tactics.',
    learningObjectives: [
      'Coordinate two knights to create combined threats',
      'Handle asymmetric material situations',
      'Understand mobility vs. power trade-offs',
      'Approach with caution and appreciate rook\'s need for open lines',
    ],
    difficultyStars: 3,
    icon: '⚖️',
  },
  // Mini-Board Puzzles Help Content
  '1X9_ROOK_RACE': {
    challenge: 'Deliver K+R vs K mate on a 2×6 in 2–3 moves.',
    solvabilityType: 'FORCED_WIN_WHITE',
    hints: ['Cut a rank with the rook', 'Bring the king to oppose', 'Finish with a ladder'],
    learningObjectives: ['Rook laddering', 'Opposition', 'Edge mates'],
    difficultyStars: 1,
    icon: '🪓'
  },
  // All 12 modes defined above
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
export function decode(code: string, variant: VariantType, boardLength?: number, boardWidth?: number): Position {
  const [cellsRaw, turnRaw] = code.trim().split(':');

  // Parse cells first to determine actual board dimensions
  let items: string[];
  let detectedWidth: number | undefined;
  let detectedHeight: number | undefined;

  if (variant === 'thin') {
    // Thin: flat comma-separated
    items = cellsRaw.split(',').map(s => s.trim());
    detectedHeight = items.length;
  } else {
    // Skinny: ranks separated by '/', cells by ','
    const ranks = cellsRaw.split('/');
    detectedHeight = ranks.length;
    detectedWidth = ranks[0].split(',').length; // Width from first rank
    items = ranks.flatMap(rank => rank.split(',').map(s => s.trim()));
  }

  // Auto-detect dimensions if not provided
  if (variant === 'thin' && !boardLength) {
    boardLength = detectedHeight;
  }
  if (variant === 'skinny') {
    if (!boardWidth) boardWidth = detectedWidth;
    if (!boardLength) boardLength = detectedHeight;
  }

  // Build position object with detected/provided dimensions
  const pos: Position = {
    variant,
    board: [], // Will be filled below
    turn: (turnRaw || 'w').trim() === 'b' ? 'b' : 'w',
  };

  if (variant === 'thin' && boardLength) {
    pos.boardLength = boardLength;
  }
  if (variant === 'skinny') {
    if (boardWidth && boardWidth !== 2) pos.boardWidth = boardWidth;
    if (boardLength && boardLength !== 10) pos.boardLength = boardLength;
  }

  // Get config for validation
  const config = getConfig(pos);

  if (items.length !== config.size) {
    throw new Error(`Expected ${config.size} squares for ${variant}, got ${items.length}`);
  }

  pos.board = items.map(s => {
    if (s === 'x') return EMPTY;
    if (!/^[wb][krnbpq]$/.test(s)) throw new Error(`Bad token: ${s}`);
    return s as Piece;
  });

  return pos;
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

    // Rook attacks (orthogonal rays) - also check for queen
    const rookDeltas = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, df] of rookDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}r` || p === `${opp}q`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Bishop attacks (diagonal rays) - also check for queen
    const bishopDeltas = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, df] of bishopDeltas) {
      let r = rank + dr;
      let f = file + df;
      while (inBounds2D(r, f, config)) {
        const j = coordsToIndex(r, f, config);
        const p = board[j];
        if (p !== EMPTY) {
          if (p === `${opp}b` || p === `${opp}q`) return true;
          break;
        }
        r += dr;
        f += df;
      }
    }

    // Pawn attacks (diagonal forward)
    const pawnDirection = side === 'w' ? -1 : 1;
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
      } else if (t === 'q') {
        // Queen: rook + bishop (orthogonal + diagonal sliding)
        const queenDeltas = [
          [-1, 0], [1, 0], [0, -1], [0, 1],      // Rook moves
          [-1, -1], [-1, 1], [1, -1], [1, 1]     // Bishop moves
        ];
        for (const [dr, df] of queenDeltas) {
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
        const direction = turn === 'w' ? -1 : 1;
        const startRank = turn === 'w' ? (config.height - 2) : 1;
        const promotionRank = turn === 'w' ? 0 : (config.height - 1);

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
    boardWidth: pos.boardWidth,
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

/**
 * Convert a move to standard algebraic notation
 * Examples: "e4", "Nf3", "Rxb5+", "O-O", "Qh4#"
 */
export function moveToAlgebraic(pos: Position, move: Move): string {
  const config = getConfig(pos);
  const piece = pos.board[move.from];
  const pieceType = typeOf(piece);
  const captured = pos.board[move.to] !== EMPTY;

  // Get destination square notation
  const [toRank, toFile] = indexToCoords(move.to, config);
  const toSquare = coordsToAlgebraic(toRank, toFile, config);

  // Check if move results in check or checkmate
  const newPos = applyMove(pos, move);
  const isCheck = newPos ? (legalMoves(newPos).length === 0 ? false : (findKing(newPos.board, newPos.turn, getConfig(newPos)) >= 0 ? attacked(newPos.board, newPos.turn, findKing(newPos.board, newPos.turn, getConfig(newPos)), getConfig(newPos)) : false)) : false;
  const isCheckmate = terminal(newPos) === `${newPos.turn === 'w' ? 'WHITE' : 'BLACK'}_MATE`;

  let notation = '';

  // Piece prefix (K, Q, R, B, N - nothing for pawns)
  if (pieceType && pieceType !== 'p') {
    notation += pieceType.toUpperCase();
  }

  // Disambiguation: check if multiple pieces of same type can reach the destination
  if (pieceType && pieceType !== 'p' && pieceType !== 'k') {
    const samePieceMoves = legalMoves(pos).filter(m => {
      const p = pos.board[m.from];
      return typeOf(p) === pieceType && sideOf(p) === pos.turn && m.to === move.to && m.from !== move.from;
    });

    if (samePieceMoves.length > 0) {
      const [fromRank, fromFile] = indexToCoords(move.from, config);
      // Check if file disambiguation is enough
      const sameFile = samePieceMoves.some(m => {
        const [, otherFile] = indexToCoords(m.from, config);
        return otherFile === fromFile;
      });

      if (!sameFile) {
        // File is enough
        notation += config.files[fromFile];
      } else {
        // Need rank or both
        const sameRank = samePieceMoves.some(m => {
          const [otherRank] = indexToCoords(m.from, config);
          return otherRank === fromRank;
        });

        if (!sameRank) {
          notation += (fromRank + 1).toString();
        } else {
          // Need both file and rank
          notation += coordsToAlgebraic(fromRank, fromFile, config);
        }
      }
    }
  }

  // Pawn captures need file notation
  if (pieceType === 'p' && captured) {
    const [, fromFile] = indexToCoords(move.from, config);
    notation += config.files[fromFile];
  }

  // Capture notation
  if (captured) {
    notation += 'x';
  }

  // Destination square
  notation += toSquare;

  // Promotion
  if (move.promotion) {
    notation += '=' + move.promotion.toUpperCase();
  }

  // Check/Checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
}
