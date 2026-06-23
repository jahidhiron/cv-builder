import { ModuleName } from '@/common/base/enums';
import { VerificationTokenPayload } from '@/modules/auth/interfaces';
import { UserService } from '@/modules/users/user.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ApplyTokenProvider } from './apply-token.provider';
import { FindOneTokenProvider } from './find-one-token.provider';

/**
 * Validates and consumes a one-time verification token.
 *
 * Shared by `VerifyEmailProvider` and `ResetPasswordProvider`. Looks up the token
 * record by `(userId, token, type, applied=false)`, rejects expired tokens, and
 * atomically marks the token as `applied` so it cannot be reused.
 *
 * @returns The user that owns the token (never `null` — throws on any invalid state).
 */
@Injectable({ scope: Scope.REQUEST })
export class VerifyTokenProvider {
  constructor(
    private readonly findOneToken: FindOneTokenProvider,
    private readonly applyToken: ApplyTokenProvider,
    private readonly userService: UserService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(payload: VerificationTokenPayload) {
    const { user } = await this.userService.findOne({ email: payload.email }, { throwError: false });

    // Use a generic "invalid token" error regardless of whether the user exists
    // to prevent callers from inferring which email addresses are registered.
    if (!user) {
      return this.errorResponse.badRequest({ module: ModuleName.Auth, key: 'invalid-token' });
    }

    const tokenRecord = await this.findOneToken.execute({
      userId: user.id,
      token: payload.token,
      type: payload.type,
      applied: false,
    });

    if (tokenRecord.expiredAt < new Date()) {
      await this.errorResponse.badRequest({ module: ModuleName.Auth, key: 'invalid-token' });
    }

    await this.applyToken.execute({ id: tokenRecord.id });

    return user;
  }
}
