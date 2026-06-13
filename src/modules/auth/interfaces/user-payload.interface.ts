export interface UserPayload {
  id: number;
  name: string;
  email: string;
  roleId?: number;
  roleKey?: string;
  role?: string;
  familyId?: string;
  sessionId?: string;
}
