import { ModuleName } from '@/common/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { VerificationTokenRepository } from '@/modules/auth/repositories';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class VerifyTokenProvider {
  constructor(
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly userRepo: UserRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(payload: VerificationTokenPayload) {
    const user = await this.userRepo.findOne({ email: payload.email });

    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.Auth, key: 'user-not-found' });
    }

    const tokenRecord = await this.verificationTokenRepo.findOne({
      userId: user!.id,
      token: payload.token,
      type: payload.type,
      applied: false,
    });

    if (!tokenRecord || tokenRecord.expiredAt < new Date()) {
      await this.errorResponse.badRequest({ module: ModuleName.Auth, key: 'invalid-token' });
    }

    await this.verificationTokenRepo.update({ id: tokenRecord!.id }, { applied: true });

    return user!;
  }
}
