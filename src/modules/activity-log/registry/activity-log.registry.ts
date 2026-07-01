import type { ActivityLogService } from '../activity-log.service';

let _service: ActivityLogService | null = null;

/**
 * Module-level singleton registry for {@link ActivityLogService}.
 *
 * Allows the `@SystemLog` decorator to access `ActivityLogService` without
 * requiring every host class to inject it via NestJS DI. The registry is
 * populated by `ActivityLogService.onModuleInit()` before any HTTP request
 * is served, and cleared by `ActivityLogService.onModuleDestroy()` so tests
 * and hot reloads never leak a stale instance.
 */
export const ActivityLogRegistry = {
  /**
   * Registers the active `ActivityLogService` instance.
   *
   * Called by `ActivityLogService.onModuleInit()` to make the service
   * available to the `@SystemLog` decorator at runtime.
   *
   * @param service - The `ActivityLogService` instance to register.
   */
  setService(service: ActivityLogService): void {
    _service = service;
  },

  /**
   * Returns the currently registered `ActivityLogService` instance.
   *
   * Returns `null` when called before `onModuleInit()` or after `onModuleDestroy()`,
   * for example during early bootstrap or in tests that do not import `ActivityLogModule`.
   *
   * @returns The registered `ActivityLogService`, or `null` if not yet set.
   */
  getService(): ActivityLogService | null {
    return _service;
  },

  /**
   * Clears the registered service instance.
   *
   * Called by `ActivityLogService.onModuleDestroy()` to prevent the previous
   * instance from leaking across hot reloads or between test runs.
   */
  clear(): void {
    if (_service) _service = null;
  },
};
