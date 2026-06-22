import { PASSWORD_HISTORY_LIMIT } from '@/modules/auth/constants/auth.constant';
import type { SavePasswordHistoryParams } from '@/modules/auth/providers/interfaces';
import { PasswordHistoryRepository } from '@/modules/auth/repositories/password-history.repository';
import { Injectable } from '@nestjs/common';

/**
 * Persists a new password hash to the user's password history and prunes
 * old entries so that at most {@link PASSWORD_HISTORY_LIMIT} records are kept.
 *
 * Used after every successful password change or reset to enforce the
 * "cannot reuse your last N passwords" policy.
 */
@Injectable()
export class SavePasswordHistoryProvider {
  constructor(private readonly passwordHistoryRepo: PasswordHistoryRepository) {}

  /**
   * Inserts the new hash and removes the oldest entries beyond the history limit.
   *
   * Both queries run independently — insertion first, then pruning — so the new
   * entry is always counted before the oldest row is removed.
   *
   * @param params.userId       - ID of the user whose history is being updated.
   * @param params.passwordHash - bcrypt/scrypt hash of the new password to record.
   */
  async execute({ userId, passwordHash }: SavePasswordHistoryParams): Promise<void> {
    await this.passwordHistoryRepo.rawQuery(
      `INSERT INTO password_histories (user_id, password_hash, created_at)
       VALUES ($1, $2, NOW())`,
      [userId, passwordHash],
    );
    await this.passwordHistoryRepo.rawQuery(
      `DELETE FROM password_histories
       WHERE user_id = $1
         AND id NOT IN (
           SELECT id FROM password_histories
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
      [userId, PASSWORD_HISTORY_LIMIT],
    );
  }
}
