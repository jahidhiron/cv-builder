/**
 * Data passed to `CreateAuthHistoryProvider` to record a login or logout event.
 * Exactly one of `loggedInAt` / `loggedOutAt` should be set per call:
 * sign-in sets `loggedInAt`; sign-out sets `loggedOutAt` and optionally `expiredAt`.
 */
export interface AuthHistoryPayload {
  userId: number;
  sessionId?: string;
  familyId?: string;
  loggedInAt?: Date;
  loggedOutAt?: Date;
  expiredAt?: Date;
}
