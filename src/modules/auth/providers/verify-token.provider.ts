import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import type { VerificationTokenPayload } from '@/modules/auth/interfaces';
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
 */
@Injectable({ scope: Scope.REQUEST })
export class VerifyTokenProvider {
  constructor(
    private readonly findOneToken: FindOneTokenProvider,
    private readonly applyToken: ApplyTokenProvider,
    private readonly userService: UserService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  /**
   * Validates and consumes a one-time verification token.
   *
   * Steps:
   * 1. **User lookup** — resolves the user by email; throws 404 if not found.
   * 2. **Token lookup** — finds the token record by `(userId, token, type, applied=false)`;
   *    throws 404 if not found (already applied or wrong type).
   * 3. **Expiry check** — rejects tokens past their `expiredAt` timestamp.
   * 4. **Consume** — atomically marks the token as `applied` so it cannot be reused.
   *
   * @param payload - Token verification input containing `email`, `token`, and `type`.
   * @returns The {@link User} that owns the token.
   * @throws {NotFoundException}   When no user exists for the given email, or the token record is not found.
   * @throws {BadRequestException} On expired or already-applied token.
   */
  @SystemLog(ModuleName.Auth)
  async execute(payload: VerificationTokenPayload) {
    const { user } = await this.userService.findOne({ email: payload.email });

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
