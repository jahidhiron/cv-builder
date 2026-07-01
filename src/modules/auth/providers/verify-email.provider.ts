import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
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
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Verifies a user's email address using a one-time token.
   *
   * Steps:
   * 1. **Token validation** — delegates to {@link VerifyTokenProvider}, which
   *    resolves the user, checks the token record, rejects expired tokens, and
   *    marks the token as consumed.
   * 2. **Already-verified guard** — rejects the request if the email is already
   *    verified to prevent duplicate processing.
   * 3. **Mark verified** — sets `emailVerified = true` and stamps `emailVerifiedAt`.
   *
   * @param dto - Contains the `email` and one-time `token` from the verification link.
   * @returns Resolves when the email has been successfully verified.
   * @throws {NotFoundException}   When the user or token record is not found.
   * @throws {BadRequestException} On expired or already-applied token.
   * @throws {ConflictException}   When the email is already verified.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: VerifyEmailDto): Promise<void> {
    const payload: VerificationTokenPayload = {
      type: TokenType.VerifyEmail,
      email: dto.email,
      token: dto.token,
    };

    const user = await this.verifyToken.execute(payload);

    if (user.emailVerified) {
      this.activityLog.logUser({
        action: AuthAction.VerifyEmailFailed,
        status: LogStatus.Failed,
        userId: user.id,
        metadata: { email: dto.email, reason: 'already-verified' },
      });
      return this.errorResponse.conflict({ module: ModuleName.Auth, key: 'user-already-verified' });
    }

    await this.userService.update(
      { id: user.id },
      { emailVerified: true, emailVerifiedAt: new Date() },
    );

    this.activityLog.logUser({
      action: AuthAction.VerifyEmailSuccess,
      userId: user.id,
      metadata: { email: dto.email },
    });
  }
}
