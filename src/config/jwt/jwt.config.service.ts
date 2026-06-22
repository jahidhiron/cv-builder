import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `jwt.*` namespace registered by `jwt.config.ts`.
 *
 * Provides signing secrets and expiry values used by the JWT strategy and the
 * cookie service. The `*ExpiredIn` getters return numeric seconds so callers
 * can compute `maxAge` for cookies without re-parsing the string form.
 */
@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** HMAC secret for signing access tokens (`JWT_ACCESS_SECRET`). */
  get accessSecret(): string {
    return this.configService.get<string>('jwt.accessSecret')!;
  }

  /** HMAC secret for signing refresh tokens (`JWT_REFRESH_SECRET`). */
  get refreshSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret')!;
  }

  /** Access token expiry as a string (e.g. `"15m"`), used when signing the JWT. */
  get accessExpiresIn(): string {
    return this.configService.get<string>('jwt.accessExpiresIn')!;
  }

  /** Refresh token expiry as a string (e.g. `"7d"`), used when signing the JWT. */
  get refreshExpiresIn(): string {
    return this.configService.get<string>('jwt.refreshExpiresIn')!;
  }

  /** Access token lifetime in seconds — used to set `maxAge` on the access-token cookie. */
  get accessTokenExpiredIn(): number {
    return this.configService.get<number>('jwt.accessTokenExpiredIn')!;
  }

  /** Refresh token lifetime in seconds — used to set `maxAge` on the refresh-token cookie. */
  get refreshTokenExpiredIn(): number {
    return this.configService.get<number>('jwt.refreshTokenExpiredIn')!;
  }

  /** Maximum continuous session lifetime in days. After this period, token rotation is rejected
   *  and the user must re-authenticate even if their refresh token is technically still valid. */
  get maxSessionDays(): number {
    return this.configService.get<number>('jwt.maxSessionDays')!;
  }
}
