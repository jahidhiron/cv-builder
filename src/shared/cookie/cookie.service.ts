import { ConfigService } from '@/config';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { COOKIE } from './constants';

export interface AuthCookieTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Centralised writer for authentication HTTP cookies.
 *
 * Static cookie flags (httpOnly, secure, sameSite, path) are sourced from
 * {@link COOKIE} constants. Only values that vary per request (maxAge) are
 * read from the injected config.
 *
 * Stateless and singleton-scoped: it does not depend on the active `Request`,
 * so it can be safely consumed by non-request-scoped controllers.
 */
@Injectable()
export class CookieService {
  constructor(private readonly config: ConfigService) {}

  /**
   * Write both the access and refresh token cookies on the response.
   *
   * The access token is scoped to the application root so it is sent on every
   * authenticated request, while the refresh token is scoped to `/v1/auth` to
   * minimise its blast radius.
   */
  setAuth(res: Response, tokens: AuthCookieTokens): void {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: COOKIE.HTTP_ONLY,
      secure: COOKIE.SECURE,
      sameSite: COOKIE.SAME_SITE,
      path: COOKIE.PATH,
      maxAge: this.config.jwt.accessTokenExpiredIn * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: COOKIE.HTTP_ONLY,
      secure: COOKIE.SECURE,
      sameSite: COOKIE.SAME_SITE,
      path: COOKIE.REFRESH_PATH,
      maxAge: this.config.jwt.refreshTokenExpiredIn * 1000,
    });
  }

  /**
   * Clear both authentication cookies. Options must mirror those used in
   * {@link setAuth} or the browser will not actually drop the cookie.
   */
  clearAuth(res: Response): void {
    res.clearCookie('accessToken', { httpOnly: COOKIE.HTTP_ONLY, secure: COOKIE.SECURE, sameSite: COOKIE.SAME_SITE, path: COOKIE.PATH });
    res.clearCookie('refreshToken', { httpOnly: COOKIE.HTTP_ONLY, secure: COOKIE.SECURE, sameSite: COOKIE.SAME_SITE, path: COOKIE.REFRESH_PATH });
  }
}
