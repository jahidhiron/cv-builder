import { ModuleName } from '@/common/base/enums';
import { BaseProvider } from '@/common/base/providers/base.provider';
import { SystemLog } from '@/modules/activity-log/decorators';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import type { ApplyTokenParams } from '@/modules/auth/providers/interfaces';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Atomically marks a verification token as consumed.
 *
 * Uses a CAS-style UPDATE (`WHERE id = :id AND applied = false`) so that a
 * token can only be applied once — concurrent requests cannot both succeed.
 * Throws a 400 "invalid-token" if the row was already applied or deleted.
 */
@Injectable()
export class ApplyTokenProvider extends BaseProvider<VerificationToken> {
  constructor(
    repo: VerificationTokenRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  @SystemLog(ModuleName.Auth)
  override async execute({ id }: ApplyTokenParams): Promise<void> {
    const rows = await this.repo.rawQuery<{ id: number }>(
      'UPDATE verification_tokens SET applied = true WHERE id = $1 AND applied = false RETURNING id',
      [id],
    );

    if (!rows.length) {
      await this.errorResponse.badRequest({ module: ModuleName.Auth, key: 'invalid-token' });
    }
  }
}
