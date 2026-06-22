export interface CreateRefreshTokenDto {
  token: string;
  userId: number;
  sessionStartedAt?: Date;
}
