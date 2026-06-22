import { ModuleName } from '@/common/base/enums';
import { BaseFindOneProvider } from '@/common/base/providers/base-find-one.provider';
import { VerificationToken } from '@/modules/auth/entities/verification-token.entity';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';

/**
 * Looks up a single verification token by the given conditions.
 * Throws a 404 when no match is found.
 */
@Injectable()
export class FindOneTokenProvider extends BaseFindOneProvider<VerificationToken> {
  constructor(repo: VerificationTokenRepository, errorResponse: ErrorResponse) {
    super(ModuleName.Auth, repo, errorResponse);
  }
}
