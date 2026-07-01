import { BaseUpdateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';

/**
 * Voids all pending (unapplied) verification tokens of a given type for a user.
 *
 * Must be called before issuing a new token to prevent token farming — without
 * this step, repeated calls to forgot-password or resend-verification would
 * accumulate multiple live tokens that could each be independently replayed.
 */
@Injectable()
export class InvalidatePreviousTokenProvider extends BaseUpdateProvider<
  VerificationToken,
  DeepPartial<VerificationToken>
> {
  constructor(
    repo: VerificationTokenRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  /**
   * Overrides the base execute to tolerate 0 matching rows.
   *
   * The base class calls `findOne` which throws 404 when no prior token exists.
   * First-time users have no token to invalidate — 0 rows affected is not an error.
   * `repo.update` returns `null` silently when nothing matches.
   */
  @SystemLog(ModuleName.Auth)
  override async execute(
    where: FindOptionsWhere<VerificationToken>,
    dto: DeepPartial<VerificationToken>,
  ): Promise<VerificationToken> {
    return (await this.repo.update(where, dto))!;
  }
}
