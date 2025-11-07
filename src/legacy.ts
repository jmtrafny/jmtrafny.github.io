/**
 * Legacy Interfaces and Exports
 *
 * These interfaces are deprecated and maintained only for backward compatibility.
 * DO NOT USE in new code - use GameMode from src/config/GameModeConfig.ts instead.
 *
 * This file may be removed in a future major version.
 */

/**
 * @deprecated Legacy interface - use GameMode from src/config/GameModeConfig.ts instead
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

/**
 * @deprecated Moved to public/game-modes.json
 */
export const SKINNY_MODE_PACK: SkinnyMode[] = [];

/**
 * 1-D Chess Mode Pack
 * Scenarios from "Interesting Starting Conditions for 1D Chess"
 *
 * @deprecated Legacy interface - use GameMode from src/config/GameModeConfig.ts instead
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

/**
 * @deprecated Moved to public/game-modes.json
 */
export const THIN_MODE_PACK: ThinMode[] = [];

/**
 * @deprecated Moved to public/game-modes.json
 */
export const MINI_BOARD_PUZZLES_PACK: Array<ThinMode | SkinnyMode> = [];

/**
 * @deprecated Legacy interface - use ModeHelp from src/config/GameModeConfig.ts instead
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

/**
 * @deprecated Moved to public/game-modes.json
 */
export const MODE_HELP_CONTENT: Record<string, ModeHelp> = {};
