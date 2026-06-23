/**
 * Claims embedded in every signed JWT (access and refresh tokens).
 *
 * `permissions` carries the array of permission keys (e.g. `["users:read", "roles:delete"]`)
 * loaded at sign-in time — `PermissionsGuard` reads from this claim to avoid a DB round-trip
 * on each request.
 * `familyId` / `sessionId` link the token to a specific device session and refresh-token family.
 */
export interface JwtPayload {
  sub: number;
  name: string;
  email: string;
  roleId?: number;
  roleKey?: string;
  role?: string;
  permissions?: string[];
  familyId?: string;
  sessionId?: string;
  /** Unix timestamp (ms) when this device session was first established.
   *  Carried through every rotation so we can enforce an absolute session
   *  max lifetime even after many token rotations. */
  firstIssuedAt?: number;
  /** Whether the user opted into an extended session at sign-in time.
   *  Carried through every rotation so refresh logic can apply the longer TTL. */
  rememberMe?: boolean;
  iat?: number;
  exp?: number;
}
