/**
 * Game Mode Configuration Type Definitions
 *
 * Defines the structure of the game-modes.json configuration file
 * and provides type-safe access to game mode data.
 */

import { VariantType } from '../engine';

/**
 * Difficulty levels for game modes
 */
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

/**
 * Solvability types indicating the nature of the position
 */
export type SolvabilityType =
  | 'FORCED_WIN_WHITE'
  | 'TACTICAL_PUZZLE'
  | 'COMPETITIVE'
  | 'DRAWISH';

/**
 * Icon types for visual identification
 */
export type ModeIcon = '🧩' | '⚖️' | '📚' | '🎯' | '👑' | '🪓';

/**
 * Category icon types
 */
export type CategoryIcon = '♟️' | '🧩';

/**
 * Strategic guidance for competitive modes
 */
export interface ModeStrategy {
  whitePlan: string;
  blackPlan: string;
  keyPositions: string;
}

/**
 * Help content for a game mode
 */
export interface ModeHelp {
  challenge: string;
  solvabilityType: SolvabilityType;
  hints: string[];
  solution: string | null;
  strategy: ModeStrategy | null;
  learningObjectives: string[];
}

/**
 * A game category (1-D Chess, Thin Chess, Mini-Board Puzzles)
 */
export interface GameModeCategory {
  id: string;
  name: string;
  description: string;
  variant: VariantType | 'mixed';
  icon: CategoryIcon;
}

/**
 * A complete game mode definition
 */
export interface GameMode {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  variant: VariantType;
  boardWidth: number;
  boardHeight: number;
  startPosition: string;
  difficulty: DifficultyLevel;
  difficultyStars: 1 | 2 | 3 | 4 | 5;
  icon: ModeIcon;
  help: ModeHelp;
}

/**
 * Root configuration structure
 */
export interface GameModeConfig {
  version: string;
  categories: GameModeCategory[];
  modes: GameMode[];
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Result of configuration validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
