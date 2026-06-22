/**
 * The deserialized user object that `JwtAuthGuard` attaches to `request.user`.
 * Mirrors `JwtPayload` but strips JWT-only fields (`iat`, `exp`) — downstream
 * handlers should use this type rather than `JwtPayload` directly.
 */
export interface UserPayload {
  id: number;
  name: string;
  email: string;
  roleId?: number;
  roleKey?: string;
  role?: string;
  permissions?: string[];
  familyId?: string;
  sessionId?: string;
}
