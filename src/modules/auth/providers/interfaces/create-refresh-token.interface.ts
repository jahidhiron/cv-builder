export interface CreateRefreshTokenDto {
  token: string;
  userId: number;
  sessionStartedAt?: Date;
  /** Override the default refresh token TTL in seconds (e.g. for rememberMe sessions). */
  expiresIn?: number;
}
