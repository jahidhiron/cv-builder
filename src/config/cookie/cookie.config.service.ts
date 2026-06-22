import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `cookie.*` namespace registered by `cookie.config.ts`.
 *
 * Centralises all cookie option values so that `CookieService` (and any other
 * code that sets cookies) reads from a single, consistent source rather than
 * each call site hardcoding options.
 */
@Injectable()
export class CookieConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** Optional `Domain` attribute — omit to scope to the current hostname. */
  get domain(): string | undefined {
    return this.configService.get<string | undefined>('cookie.domain');
  }
}
