import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `google.*` namespace registered by `google.config.ts`.
 *
 * Provides Google OAuth 2.0 credentials used by the Google sign-in provider
 * to verify id tokens via the Google Auth Library.
 */
@Injectable()
export class GoogleConfigService {
  /**
   * @param configService - NestJS config service used to read the `google.*` namespace.
   */
  constructor(private readonly configService: ConfigService) {}

  /** Google OAuth 2.0 client ID (`GOOGLE_CLIENT_ID`). */
  get clientId(): string {
    return this.configService.get<string>('google.clientId')!;
  }

  /** Google OAuth 2.0 client secret (`GOOGLE_CLIENT_SECRET`). */
  get clientSecret(): string {
    return this.configService.get<string>('google.clientSecret')!;
  }
}
