/**
 * Controls how `AuthGuard` (the global guard) processes a route.
 * Applied via the `@Auth()` decorator:
 * - `Bearer`   — default; requires a valid JWT access token.
 * - `None`     — publicly accessible; JWT validation is skipped entirely.
 * - `Optional` — JWT is validated when present, but the route is still accessible without one.
 */
export enum AuthType {
  Bearer = 'Bearer',
  None = 'None',
  Optional = 'Optional',
}
