import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  /** Access token lifetime in seconds (used for cookie maxAge, Redis TTL, etc.) */
  accessTokenExpiredIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? '900', 10),
  /** Refresh token lifetime in seconds */
  refreshTokenExpiredIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS ?? '604800', 10),
  /** Maximum continuous session lifetime in days regardless of refresh rotations */
  maxSessionDays: parseInt(process.env.JWT_MAX_SESSION_DAYS ?? '30', 10),
}));
