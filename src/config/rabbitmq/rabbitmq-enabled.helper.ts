/**
 * Single source of truth for the `ENABLE_RABBITMQ` env flag.
 *
 * This helper is read **only** during Nest module evaluation (before DI is
 * available), so we cannot route through `ConfigService` here. Funneling every
 * read through this function keeps the value consistent between
 * `rabbitmqConfig()` (which feeds `ConfigService`) and `RabbitMqModule.register()`
 * (which decides whether to wire up the RMQ transport), and gives us one
 * place to add logging, deprecation warnings, or fallback behavior.
 *
 * If the value is changed at runtime, the application must be restarted.
 */
export const isRabbitmqEnabled = (): boolean =>
  (process.env.ENABLE_RABBITMQ ?? '').toLowerCase() === 'true';
