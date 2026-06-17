import { ModuleName } from '@/common/enums';
import { TokenType } from '@/modules/auth/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { VerifyTokenProvider } from '@/modules/auth/providers/verify-token.provider';
import { UpdateUserProvider } from '@/modules/users/providers/update-user.provider';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { VerifyEmailDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class VerifyEmailProvider {
  constructor(
    private readonly updateUser: UpdateUserProvider,
    private readonly verifyToken: VerifyTokenProvider,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(dto: VerifyEmailDto): Promise<void> {
    const payload: VerificationTokenPayload = {
      type: TokenType.VerifyEmail,
      email: dto.email,
      token: dto.token,
    };

    const user = await this.verifyToken.execute(payload);
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }

    if (user.emailVerified) {
      await this.errorResponse.conflict({ module: ModuleName.Auth, key: 'user-already-verified' });
    }

    await this.updateUser.execute({ id: user.id }, { emailVerified: true, emailVerifiedAt: new Date() });
  }
}
