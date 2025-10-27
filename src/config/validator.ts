/**
 * Configuration Validator
 *
 * Validates the structure and content of game-modes.json
 * to ensure data integrity before use.
 */

import type {
  ValidationResult,
  ValidationError,
  DifficultyLevel,
  SolvabilityType,
} from './GameModeConfig';

const VALID_DIFFICULTIES: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const VALID_SOLVABILITY_TYPES: SolvabilityType[] = [
  'FORCED_WIN_WHITE',
  'TACTICAL_PUZZLE',
  'COMPETITIVE',
  'DRAWISH',
];

/**
 * Validate the entire configuration object
 */
export function validate(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Configuration must be an object' }],
    };
  }

  const config = data as Record<string, unknown>;

  // Validate version
  if (typeof config.version !== 'string' || !config.version) {
    errors.push({ field: 'version', message: 'Version must be a non-empty string' });
  }

  // Validate defaultGame (optional)
  if (config.defaultGame !== undefined) {
    errors.push(...validateDefaultGame(config.defaultGame, config.modes));
  }

  // Validate categories array
  if (!Array.isArray(config.categories)) {
    errors.push({ field: 'categories', message: 'Categories must be an array' });
  } else {
    config.categories.forEach((category, index) => {
      errors.push(...validateCategory(category, index));
    });
  }

  // Validate modes array
  if (!Array.isArray(config.modes)) {
    errors.push({ field: 'modes', message: 'Modes must be an array' });
  } else {
    config.modes.forEach((mode, index) => {
      errors.push(...validateMode(mode, index));
    });

    // Check for duplicate mode IDs
    const modeIds = new Set<string>();
    config.modes.forEach((mode: unknown) => {
      if (typeof mode === 'object' && mode !== null) {
        const m = mode as Record<string, unknown>;
        if (typeof m.id === 'string') {
          if (modeIds.has(m.id)) {
            errors.push({
              field: 'modes',
              message: `Duplicate mode ID: ${m.id}`,
              value: m.id,
            });
          }
          modeIds.add(m.id);
        }
      }
    });

    // Validate that all categoryIds reference existing categories
    if (Array.isArray(config.categories)) {
      const categoryIds = new Set(
        config.categories.map((cat: unknown) =>
          typeof cat === 'object' && cat !== null ? (cat as Record<string, unknown>).id : undefined
        )
      );

      config.modes.forEach((mode: unknown) => {
        if (typeof mode === 'object' && mode !== null) {
          const m = mode as Record<string, unknown>;
          if (typeof m.categoryId === 'string' && !categoryIds.has(m.categoryId)) {
            errors.push({
              field: `mode.${m.id}.categoryId`,
              message: `References non-existent category: ${m.categoryId}`,
              value: m.categoryId,
            });
          }
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate default game configuration
 */
function validateDefaultGame(defaultGame: unknown, modes: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = 'defaultGame';

  if (!defaultGame || typeof defaultGame !== 'object') {
    return [{ field: prefix, message: 'defaultGame must be an object' }];
  }

  const dg = defaultGame as Record<string, unknown>;

  // Validate modeId
  if (typeof dg.modeId !== 'string' || !dg.modeId) {
    errors.push({
      field: `${prefix}.modeId`,
      message: 'modeId must be a non-empty string',
    });
  } else if (Array.isArray(modes)) {
    // Check that modeId references an existing mode
    const modeIds = modes.map((m: unknown) =>
      typeof m === 'object' && m !== null ? (m as Record<string, unknown>).id : undefined
    );
    if (!modeIds.includes(dg.modeId)) {
      errors.push({
        field: `${prefix}.modeId`,
        message: `References non-existent mode: ${dg.modeId}`,
        value: dg.modeId,
      });
    }
  }

  // Validate gameType
  if (typeof dg.gameType !== 'string' || !['1player', '2player'].includes(dg.gameType)) {
    errors.push({
      field: `${prefix}.gameType`,
      message: 'gameType must be "1player" or "2player"',
      value: dg.gameType,
    });
  }

  // Validate playerSide
  if (typeof dg.playerSide !== 'string' || !['w', 'b'].includes(dg.playerSide)) {
    errors.push({
      field: `${prefix}.playerSide`,
      message: 'playerSide must be "w" or "b"',
      value: dg.playerSide,
    });
  }

  return errors;
}

/**
 * Validate a single category
 */
function validateCategory(category: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `categories[${index}]`;

  if (!category || typeof category !== 'object') {
    return [{ field: prefix, message: 'Category must be an object' }];
  }

  const cat = category as Record<string, unknown>;

  // Required string fields
  const requiredStrings = ['id', 'name', 'description', 'icon'];
  for (const field of requiredStrings) {
    if (typeof cat[field] !== 'string' || !cat[field]) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `${field} must be a non-empty string`,
      });
    }
  }

  return errors;
}

/**
 * Validate a single game mode
 */
function validateMode(mode: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = `modes[${index}]`;

  if (!mode || typeof mode !== 'object') {
    return [{ field: prefix, message: 'Mode must be an object' }];
  }

  const m = mode as Record<string, unknown>;

  // Required string fields
  const requiredStrings = [
    'id',
    'categoryId',
    'name',
    'description',
    'variant',
    'startPosition',
    'difficulty',
    'icon',
  ];

  for (const field of requiredStrings) {
    if (typeof m[field] !== 'string' || !m[field]) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `${field} must be a non-empty string`,
      });
    }
  }

  // Required number fields
  if (typeof m.boardWidth !== 'number' || m.boardWidth < 1) {
    errors.push({
      field: `${prefix}.boardWidth`,
      message: 'boardWidth must be a positive number',
      value: m.boardWidth,
    });
  }

  if (typeof m.boardHeight !== 'number' || m.boardHeight < 1) {
    errors.push({
      field: `${prefix}.boardHeight`,
      message: 'boardHeight must be a positive number',
      value: m.boardHeight,
    });
  }

  // Validate difficultyStars (1-5)
  if (
    typeof m.difficultyStars !== 'number' ||
    m.difficultyStars < 1 ||
    m.difficultyStars > 5
  ) {
    errors.push({
      field: `${prefix}.difficultyStars`,
      message: 'difficultyStars must be a number between 1 and 5',
      value: m.difficultyStars,
    });
  }

  // Validate difficulty
  if (typeof m.difficulty === 'string' && !VALID_DIFFICULTIES.includes(m.difficulty as DifficultyLevel)) {
    errors.push({
      field: `${prefix}.difficulty`,
      message: `Invalid difficulty: ${m.difficulty}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      value: m.difficulty,
    });
  }

  // Validate variant
  if (typeof m.variant === 'string' && !['1xN', 'NxM'].includes(m.variant)) {
    errors.push({
      field: `${prefix}.variant`,
      message: `Invalid variant: ${m.variant}. Must be '1xN' or 'NxM'`,
      value: m.variant,
    });
  }

  // Validate help object
  if (!m.help || typeof m.help !== 'object') {
    errors.push({
      field: `${prefix}.help`,
      message: 'help must be an object',
    });
  } else {
    const help = m.help as Record<string, unknown>;

    if (typeof help.challenge !== 'string' || !help.challenge) {
      errors.push({
        field: `${prefix}.help.challenge`,
        message: 'help.challenge must be a non-empty string',
      });
    }

    if (
      typeof help.solvabilityType === 'string' &&
      !VALID_SOLVABILITY_TYPES.includes(help.solvabilityType as SolvabilityType)
    ) {
      errors.push({
        field: `${prefix}.help.solvabilityType`,
        message: `Invalid solvabilityType: ${help.solvabilityType}`,
        value: help.solvabilityType,
      });
    }

    if (!Array.isArray(help.hints)) {
      errors.push({
        field: `${prefix}.help.hints`,
        message: 'help.hints must be an array',
      });
    } else if (!help.hints.every((h) => typeof h === 'string')) {
      errors.push({
        field: `${prefix}.help.hints`,
        message: 'All hints must be strings',
      });
    }
  }

  return errors;
}

/**
 * Check if a string is a valid mode ID format
 */
export function isValidModeId(id: string): boolean {
  return /^[A-Z0-9_]+$/.test(id);
}

/**
 * Check if a string is a valid category ID format
 */
export function isValidCategoryId(id: string): boolean {
  return /^[a-z0-9-]+$/.test(id);
}
