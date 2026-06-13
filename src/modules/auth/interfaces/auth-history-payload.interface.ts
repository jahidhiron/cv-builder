export interface AuthHistoryPayload {
  userId: number;
  sessionId: string;
  familyId?: string;
  loggedInAt?: Date;
  loggedOutAt?: Date;
  expiredAt?: Date;
}
