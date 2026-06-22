/**
 * Controls the scope of `LogoutProvider`:
 * - `Current` — revokes only the refresh token for the current device/session.
 * - `All`     — revokes every active refresh token for the user (all devices).
 */
export enum LogoutType {
  Current = 'current',
  All = 'all',
}
