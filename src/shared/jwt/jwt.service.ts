import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

/**
 * Centralised JWT utility wrapping NestJS's raw `JwtService` with
 * pre-configured access and refresh token operations.
 *
 * Providers and guards inject this service instead of `@nestjs/jwt` directly
 * so that signing secrets and expiry values are never scattered across the
 * codebase — only this service reads `ConfigService.jwt`.
 */
@Injectable()
export class JwtService {
  /**
   * @param config - Supplies JWT secrets and TTL values (`ConfigService.jwt`).
   * @param jwt - Underlying `@nestjs/jwt` service used for signing, verifying, and decoding.
   */
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: NestJwtService,
  ) {}

  /**
   * Sign a payload with fully custom options.
   *
   * @param payload - Object to encode as the JWT body.
   * @param options - Optional overrides (secret, expiresIn, etc.).
   * @returns Signed JWT string.
   */
  sign<T extends object>(payload: T, options?: JwtSignOptions): string {
    return this.jwt.sign(payload, options);
  }

  /**
   * Verify a token with fully custom options.
   *
   * @param token   - Raw JWT string to verify.
   * @param options - Optional overrides (secret, etc.).
   * @returns Decoded and verified payload.
   * @throws {JsonWebTokenError} On invalid signature.
   * @throws {TokenExpiredError} On expired token.
   */
  verify<T extends object>(token: string, options?: JwtVerifyOptions): T {
    return this.jwt.verify<T>(token, options);
  }

  /**
   * Decode a token without verifying the signature.
   *
   * Use only when you need to inspect the payload of an already-expired or
   * unverified token (e.g. to extract `sub` for session cleanup on expiry).
   *
   * @param token - Raw JWT string.
   * @returns Decoded payload, or `null` if the token cannot be parsed.
   */
  decode<T extends object>(token: string): T | null {
    return this.jwt.decode<T | null>(token);
  }

  /**
   * Sign a payload as an access token using the configured access secret and TTL.
   *
   * @param payload - Object to encode.
   * @returns Signed access token string.
   */
  signAccessToken<T extends object>(payload: T): string {
    return this.sign(payload, {
      secret: this.config.jwt.accessSecret,
      expiresIn: this.config.jwt.accessTokenExpiredIn,
    });
  }

  /**
   * Sign a payload as a refresh token using the configured refresh secret and TTL.
   * Applies the extended TTL when `rememberMe` is `true`.
   *
   * @param payload    - Object to encode.
   * @param rememberMe - When `true`, uses `rememberMeRefreshTokenExpiredIn` instead of the default TTL.
   * @returns Signed refresh token string.
   */
  signRefreshToken<T extends object>(payload: T, rememberMe = false): string {
    return this.sign(payload, {
      secret: this.config.jwt.refreshSecret,
      expiresIn: this.getRefreshTtl(rememberMe),
    });
  }

  /**
   * Verify a token against the configured access secret.
   *
   * @param token - Raw access JWT string.
   * @returns Decoded and verified payload.
   * @throws {JsonWebTokenError} On invalid signature.
   * @throws {TokenExpiredError} On expired token.
   */
  verifyAccessToken<T extends object>(token: string): T {
    return this.verify<T>(token, { secret: this.config.jwt.accessSecret });
  }

  /**
   * Verify a token against the configured refresh secret.
   *
   * @param token - Raw refresh JWT string.
   * @returns Decoded and verified payload.
   * @throws {JsonWebTokenError} On invalid signature.
   * @throws {TokenExpiredError} On expired token.
   */
  verifyRefreshToken<T extends object>(token: string): T {
    return this.verify<T>(token, { secret: this.config.jwt.refreshSecret });
  }

  /**
   * Access token lifetime in seconds sourced from config.
   * Use for Redis TTL or cookie `maxAge` when issuing access tokens.
   *
   * @returns Access token TTL in seconds.
   */
  getAccessTtl(): number {
    return this.config.jwt.accessTokenExpiredIn;
  }

  /**
   * Refresh token lifetime in seconds sourced from config.
   * Use for Redis TTL, cookie `maxAge`, or DB `expiresAt` when issuing refresh tokens.
   *
   * @param rememberMe - When `true`, returns the extended remember-me TTL.
   * @returns Refresh token TTL in seconds.
   */
  getRefreshTtl(rememberMe: boolean): number {
    return rememberMe
      ? this.config.jwt.rememberMeRefreshTokenExpiredIn
      : this.config.jwt.refreshTokenExpiredIn;
  }
}
