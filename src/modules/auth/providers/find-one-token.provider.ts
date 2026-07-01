import type { FindOneOptions } from '@/common/base';
import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Looks up a single verification token by the given conditions.
 * Throws a 404 when no match is found.
 */
@Injectable()
export class FindOneTokenProvider extends BaseFindOneProvider<VerificationToken> {
  constructor(
    repo: VerificationTokenRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Auth, repo, errorResponse);
  }

  /**
   * Finds a single verification token matching the given conditions.
   *
   * @param where   - TypeORM filter conditions (e.g. `{ token, type }`).
   * @param options - Optional query options; set `throwError: false` to return
   *                  `null` instead of throwing when no match is found.
   * @returns The matching {@link VerificationToken}, or `null` when
   *          `throwError` is `false` and no record exists.
   * @throws {NotFoundException} When no match is found and `throwError` is not `false`.
   */
  @SystemLog(ModuleName.Auth)
  override async execute<TThrow extends boolean = true>(
    where: FindOptionsWhere<VerificationToken>,
    options?: FindOneOptions<VerificationToken, TThrow>,
  ): Promise<TThrow extends false ? VerificationToken | null : VerificationToken> {
    return this.findOne(where, options);
  }
}