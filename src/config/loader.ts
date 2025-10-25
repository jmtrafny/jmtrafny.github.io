/**
 * Configuration Loader
 *
 * Loads and validates the game-modes.json configuration file.
 * Provides cached access to game mode data with error handling.
 */

import type {
  GameModeConfig,
  GameMode,
  GameModeCategory,
} from './GameModeConfig';
import { validate } from './validator';

// Module-level cache for configuration to avoid repeated file fetches
// These persist across component re-renders and only reset on hot reload or clearConfigCache()
let configCache: GameModeConfig | null = null;
let loadError: Error | null = null;

/**
 * Load the game modes configuration from JSON file
 *
 * @returns Promise resolving to validated configuration
 * @throws Error if loading or validation fails
 */
export async function loadGameModeConfig(): Promise<GameModeConfig> {
  // Return cached config if available
  if (configCache) {
    return configCache;
  }

  // Return cached error if previous load failed
  if (loadError) {
    throw loadError;
  }

  try {
    // Fetch from public directory - path is relative to site root
    // Assumes game-modes.json is in the public/ folder (Vite serves it at root)
    const response = await fetch('/game-modes.json');

    if (!response.ok) {
      throw new Error(
        `Failed to load game-modes.json: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate the configuration
    const validationResult = validate(data);

    if (!validationResult.valid) {
      const errorMessages = validationResult.errors
        .map((e) => `  - ${e.field}: ${e.message}`)
        .join('\n');

      throw new Error(
        `Invalid game-modes.json configuration:\n${errorMessages}`
      );
    }

    // Cast to GameModeConfig after validation
    configCache = data as GameModeConfig;

    console.log(
      `[Config] Loaded ${configCache.modes.length} game modes in ${configCache.categories.length} categories`
    );

    return configCache;
  } catch (error) {
    loadError = error as Error;
    console.error('[Config] Failed to load configuration:', error);
    throw loadError;
  }
}

/**
 * Get all categories
 */
export function getCategories(config: GameModeConfig): GameModeCategory[] {
  return config.categories;
}

/**
 * Get category by ID
 */
export function getCategoryById(
  config: GameModeConfig,
  categoryId: string
): GameModeCategory | undefined {
  return config.categories.find((cat) => cat.id === categoryId);
}

/**
 * Get all modes in a category
 */
export function getModesByCategory(
  config: GameModeConfig,
  categoryId: string
): GameMode[] {
  return config.modes.filter((mode) => mode.categoryId === categoryId);
}

/**
 * Get mode by ID
 */
export function getModeById(
  config: GameModeConfig,
  modeId: string
): GameMode | undefined {
  return config.modes.find((mode) => mode.id === modeId);
}

/**
 * Get all modes
 */
export function getAllModes(config: GameModeConfig): GameMode[] {
  return config.modes;
}

/**
 * Clear the configuration cache (useful for testing or hot reload)
 */
export function clearConfigCache(): void {
  configCache = null;
  loadError = null;
}

/**
 * Check if configuration is loaded
 */
export function isConfigLoaded(): boolean {
  return configCache !== null;
}

/**
 * Get configuration version
 */
export function getConfigVersion(config: GameModeConfig): string {
  return config.version;
}
