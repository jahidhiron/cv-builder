import { ModuleName } from '@/common/base/enums';
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
