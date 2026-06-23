import { ModuleName } from '@/common/base/enums';
import { TokenType } from '@/modules/auth/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { VerifyTokenProvider } from '@/modules/auth/providers/verify-token.provider';
import { UserService } from '@/modules/users/user.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { VerifyEmailDto } from '../dtos';

/**
 * Marks a user's email as verified after consuming a valid one-time token.
 *
 * Delegates token validation to {@link VerifyTokenProvider} then updates
 * `emailVerified` and `emailVerifiedAt` on the user record.
 * Rejects tokens that have already been used (i.e. `user.emailVerified === true`).
 */
@Injectable({ scope: Scope.REQUEST })
export class VerifyEmailProvider {
  constructor(
    private readonly userService: UserService,
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
      return this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }

    if (user.emailVerified) {
      return this.errorResponse.conflict({ module: ModuleName.Auth, key: 'user-already-verified' });
    }

    await this.userService.update(
      { id: user.id },
      { emailVerified: true, emailVerifiedAt: new Date() },
    );
  }
}
