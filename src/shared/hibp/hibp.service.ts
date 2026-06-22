import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { AppLogger } from '@/config/logger';
import { createHash } from 'node:crypto';
import { HIBP_API, HIBP_TIMEOUT_MS } from './constants';

/**
 * Checks a plaintext password against the HaveIBeenPwned k-anonymity API.
 *
 * Only the first 5 characters of the SHA-1 hash are sent to the API;
 * the full hash never leaves the process. Disabled automatically when
 * `HIBP_CHECK_ENABLED=false` (useful in dev/test without internet access).
 */
@Injectable()
export class HibpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponse,
    private readonly logger: AppLogger,
  ) {}

  async checkPassword(password: string): Promise<void> {
    if (!this.configService.app.hibpEnabled) return;

    const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    let text: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HIBP_TIMEOUT_MS);
      try {
        const response = await fetch(`${HIBP_API}${prefix}`, {
          headers: { 'Add-Padding': 'true' },
          signal: controller.signal,
        });
        text = await response.text();
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      // Network errors or timeouts must never block the user — log and continue.
      if ((err as Error).name !== 'AbortError') {
        this.logger.error(`HIBP check failed (non-blocking): ${(err as Error).message}`);
      }
      return;
    }

    for (const line of text.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const hashSuffix = line.slice(0, colonIdx).trim();
      if (hashSuffix === suffix) {
        const count = parseInt(line.slice(colonIdx + 1).trim(), 10);
        if (count > 0) {
          await this.errorResponse.unprocessableEntity({
            module: ModuleName.Auth,
            key: 'password-breached',
          });
        }
      }
    }
  }
}
