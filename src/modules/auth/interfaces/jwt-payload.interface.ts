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
  iat?: number;
  exp?: number;
}
