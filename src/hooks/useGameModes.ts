/**
 * useGameModes Hook
 *
 * Provides access to game mode configuration data with loading states.
 */

import { useState, useEffect } from 'react';
import type { GameModeConfig, GameMode, GameModeCategory } from '../config/GameModeConfig';
import {
  loadGameModeConfig,
  getCategoryById,
  getModesByCategory,
  getModeById,
  getCategories,
} from '../config/loader';

interface UseGameModesResult {
  config: GameModeConfig | null;
  loading: boolean;
  error: Error | null;
  categories: GameModeCategory[];
  getModesByCategory: (categoryId: string) => GameMode[];
  getMode: (modeId: string) => GameMode | undefined;
  getCategory: (categoryId: string) => GameModeCategory | undefined;
}

/**
 * Hook to access game mode configuration
 *
 * Automatically loads configuration on mount and provides helper functions
 * to query categories and modes.
 */
export function useGameModes(): UseGameModesResult {
  const [config, setConfig] = useState<GameModeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadGameModeConfig()
      .then((loadedConfig) => {
        setConfig(loadedConfig);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return {
    config,
    loading,
    error,
    categories: config ? getCategories(config) : [],
    getModesByCategory: (categoryId: string) =>
      config ? getModesByCategory(config, categoryId) : [],
    getMode: (modeId: string) => (config ? getModeById(config, modeId) : undefined),
    getCategory: (categoryId: string) =>
      config ? getCategoryById(config, categoryId) : undefined,
  };
}
