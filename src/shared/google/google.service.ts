import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ErrorResponse } from '@/shared/response';
import { HttpException, Injectable, Scope } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import type { VerifyIdTokenParams } from './interfaces';
import { GooglePayload } from './interfaces';

/**
 * Shared service for Google OAuth id-token verification.
 *
 * Wraps `google-auth-library`'s `OAuth2Client` and normalises the raw payload
 * into a typed {@link GooglePayload}. Throws 401 on any verification failure
 * so callers always receive a fully-populated payload or never continue.
 */
@Injectable({ scope: Scope.REQUEST })
export class GoogleService {
  /**
   * @param configService - Application config service, used to resolve the Google OAuth client ID.
   * @param errorResponse - Utility for throwing standardised error responses.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Verify a Google id token and return the normalised user payload.
   *
   * @param idToken - The raw id token string received from the client.
   * @returns Verified Google user payload.
   * @throws {UnauthorizedException} When the token is invalid, expired, or missing required claims.
   */
  async verifyIdToken({ idToken }: VerifyIdTokenParams): Promise<GooglePayload> {
    const client = new OAuth2Client(this.configService.google.clientId);
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.configService.google.clientId,
      });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email) {
        return await this.errorResponse.unauthorized({
          module: ModuleName.Auth,
          key: 'invalid-google-token',
        });
      }
      return {
        sub: p.sub,
        email: p.email,
        name: p.name ?? p.email,
        picture: p.picture,
      };
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      return await this.errorResponse.unauthorized({
        module: ModuleName.Auth,
        key: 'invalid-google-token',
      });
    }
  }
}
