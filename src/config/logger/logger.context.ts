import type { AppLogger } from './logger.service';

let _logger: AppLogger | null = null;

/**
 * Module-level holder for the singleton {@link AppLogger} instance.
 *
 * Lets code outside the Nest DI container (e.g. static helpers, standalone
 * functions) access the app's configured logger once it has been registered
 * at bootstrap, without needing the instance threaded through as an argument.
 */
export const LoggerContext = {
  /**
   * Stores `logger` as the shared instance returned by subsequent {@link get} calls.
   *
   * @param logger - The {@link AppLogger} instance to register.
   */
  register(logger: AppLogger): void {
    _logger = logger;
  },

  /**
   * Returns the previously registered {@link AppLogger} instance.
   *
   * @returns The registered logger, or `null` if {@link register} has not been called yet.
   */
  get(): AppLogger | null {
    return _logger;
  },
};
