import { ConfigService } from '@/config';
import { CookieConfigService } from '@/config/cookie';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

export interface AuthCookieTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Centralised writer for authentication HTTP cookies.
 *
 * Every option (path, max-age, same-site, secure, etc.) is sourced from the
 * application config so that cookie behaviour can be tuned via environment
 * variables without touching feature code.
 *
 * Stateless and singleton-scoped: it does not depend on the active `Request`,
 * so it can be safely consumed by non-request-scoped controllers.
 */
@Injectable()
export class CookieService {
  constructor(
    private readonly cookieConfig: CookieConfigService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Write both the access and refresh token cookies on the response.
   *
   * The access token is scoped to the application root so it is sent on every
   * authenticated request, while the refresh token is scoped to `/v1/auth` to
   * minimise its blast radius.
   */
  setAuth(res: Response, tokens: AuthCookieTokens): void {
    const { httpOnly, secure, sameSite, path, refreshPath } = this.cookieConfig;

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly,
      secure,
      sameSite,
      path,
      maxAge: this.config.jwt.accessTokenExpiredIn * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly,
      secure,
      sameSite,
      path: refreshPath,
      maxAge: this.config.jwt.refreshTokenExpiredIn * 1000,
    });
  }

  /**
   * Clear both authentication cookies. Options must mirror those used in
   * {@link setAuth} or the browser will not actually drop the cookie.
   */
  clearAuth(res: Response): void {
    const { httpOnly, secure, sameSite, path, refreshPath } = this.cookieConfig;
    res.clearCookie('accessToken', { httpOnly, secure, sameSite, path });
    res.clearCookie('refreshToken', { httpOnly, secure, sameSite, path: refreshPath });
  }
}
