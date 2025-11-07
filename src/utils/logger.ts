/**
 * Debug Logger Utility
 *
 * Provides conditional logging that only runs in development mode.
 * Reduces production bundle size and prevents console clutter.
 */

// Only enable logging in development mode
const DEBUG = import.meta.env.DEV;

/**
 * Logger interface matching console API
 */
export const logger = {
  /**
   * Debug-level logging (only in development)
   * Use for verbose debugging information
   */
  debug: (...args: unknown[]): void => {
    if (DEBUG) {
      console.log(...args);
    }
  },

  /**
   * Info-level logging (only in development)
   * Use for general informational messages
   */
  info: (...args: unknown[]): void => {
    if (DEBUG) {
      console.log(...args);
    }
  },

  /**
   * Warning-level logging (always enabled)
   * Use for recoverable errors or unexpected conditions
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Error-level logging (always enabled)
   * Use for critical errors that require attention
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

/**
 * Convenience function for logging with a module prefix
 *
 * @example
 * ```typescript
 * const log = createLogger('Solver');
 * log.debug('Attempting Tier 1'); // Outputs: [Solver] Attempting Tier 1
 * ```
 */
export function createLogger(module: string) {
  return {
    debug: (...args: unknown[]) => logger.debug(`[${module}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${module}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${module}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${module}]`, ...args),
  };
}
