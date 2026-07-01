import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { CheckPasswordHistoryParams } from '@/modules/auth/providers/interfaces';
import { PasswordHistoryRepository } from '@/modules/auth/repositories/password-history.repository';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Guards against password reuse by checking the new password against the
 * user's last N stored hashes (scrypt verification for each).
 *
 * Throws an unprocessable-entity error if the new password matches any
 * previously used hash.
 */
@Injectable()
export class CheckPasswordHistoryProvider {
  constructor(
    private readonly passwordHistoryRepo: PasswordHistoryRepository,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Checks whether a new password has been used recently.
   *
   * Steps:
   * 1. **History fetch** — retrieves the user's last 5 password hashes ordered
   *    by most recent first.
   * 2. **Parallel verification** — runs scrypt `verify` against all fetched hashes
   *    concurrently to minimise latency.
   * 3. **Reuse check** — throws if any hash matches the new password.
   *
   * @param params            - Check parameters.
   * @param params.userId     - ID of the user whose history is checked.
   * @param params.newPassword - Plain-text password to verify against stored hashes.
   * @returns Resolves when the password is not found in the recent history.
   * @throws {UnprocessableEntityException} When the new password matches any of the last 5 stored hashes.
   */
  @SystemLog(ModuleName.Auth)
  async execute({ userId, newPassword }: CheckPasswordHistoryParams): Promise<void> {
    const history = await this.passwordHistoryRepo.findMany(
      { userId },
      { order: { createdAt: 'DESC' }, take: 5 },
    );

    const results = await Promise.all(
      history.map((entry) => this.hashService.verify(entry.passwordHash, newPassword)),
    );

    if (results.some(Boolean)) {
      await this.errorResponse.unprocessableEntity({
        module: ModuleName.Auth,
        key: 'password-previously-used',
      });
    }
  }
}
