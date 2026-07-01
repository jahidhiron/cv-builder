import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import { HttpClientService } from '@/shared/http-client';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { firstValueFrom } from 'rxjs';
import { HIBP_API, HIBP_TIMEOUT_MS } from './constants';

/**
 * Validates passwords against the HaveIBeenPwned (HIBP) Pwned Passwords API
 * using the k-anonymity range model.
 *
 * **Privacy model**: only the first 5 hex characters of the SHA-1 hash are
 * transmitted to the API; the remainder is compared locally. The plaintext
 * password and full hash never leave the process.
 *
 * **Fail-open**: network errors and timeouts are logged and silently swallowed
 * so a transient HIBP outage never blocks a legitimate user from registering.
 *
 * **Feature flag**: the check is skipped entirely when
 * `HIBP_CHECK_ENABLED=false`, allowing development and test environments to
 * operate without internet access.
 */
@Injectable()
export class HibpService {
  /**
   * @param configService - Application config service, used to read the HIBP feature flag.
   * @param errorResponse - Utility for throwing standardised error responses.
   * @param logger - Application logger, used to record non-blocking HIBP failures.
   * @param httpClient - Shared HTTP client used to call the HIBP range API.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly errorResponse: ErrorResponse,
    private readonly logger: AppLogger,
    private readonly httpClient: HttpClientService,
  ) {}

  /**
   * Asserts that `password` has not appeared in a known data breach.
   *
   * Algorithm:
   * 1. **Hash** — SHA-1-hashes the password and uppercases the hex digest.
   * 2. **Range lookup** — sends the first 5 characters (the *prefix*) to
   *    `https://api.pwnedpasswords.com/range/{prefix}`.
   * 3. **Suffix match** — parses the returned newline-delimited `SUFFIX:COUNT`
   *    list and compares the remaining 35 characters of the local hash.
   * 4. **Rejection** — throws `UnprocessableEntityException` when a match is found.
   *
   * The outbound request is cancelled by {@link HttpClientService} after
   * {@link HIBP_TIMEOUT_MS} milliseconds via Axios `timeout`. Any network
   * error is surfaced as a failed `HttpResponse` and does **not** propagate —
   * the method returns normally so the caller is unblocked.
   *
   * @param password - The plaintext password to validate.
   * @returns Resolves with `void` when the password is clean (or the check
   *          is disabled / the API is unreachable).
   * @throws {UnprocessableEntityException} When the password hash suffix is
   *         found in the HIBP dataset with a breach count greater than zero.
   */
  @SystemLog(ModuleName.Shared)
  async checkPassword(password: string): Promise<void> {
    if (!this.configService.app.hibpEnabled) return;

    const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await firstValueFrom(
      this.httpClient.get<string>(`${HIBP_API}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        timeout: HIBP_TIMEOUT_MS,
        responseType: 'text',
      }),
    );

    if (!response.success || !response.data) {
      if (response.error) {
        this.logger.error(`HIBP check failed (non-blocking): ${response.error}`);
      }
      return;
    }

    for (const line of response.data.split('\n')) {
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
