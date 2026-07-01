import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { UserService } from '@/modules/users/user.service';
import { buildResendVerificationEmail } from '@/modules/auth/mail';
import { MailService } from '@/shared/mail/mail.service';
import { Injectable, Scope } from '@nestjs/common';
import { ResendVerificationDto } from '../dtos';

/**
 * Resends the email-verification link to a user who has not yet verified their account.
 *
 * Any ineligible state (unknown email, deleted account, already verified) returns
 * silently with a 200 to prevent account enumeration — callers cannot distinguish
 * between "email not found" and "email already verified".
 */
@Injectable({ scope: Scope.REQUEST })
export class ResendVerificationProvider {
  constructor(
    private readonly userService: UserService,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Resends the email-verification link to an unverified user.
   *
   * Steps:
   * 1. **User lookup** — resolves the user by email with `throwError: false`.
   * 2. **Eligibility guard** — silently returns 200 if the user does not exist,
   *    is deleted, or is already verified, to prevent account enumeration.
   * 3. **Token creation** — generates a new one-time `VerifyEmail` token.
   * 4. **Email dispatch** — sends the verification link to the user's email address.
   *
   * @param dto - Contains the `email` to send the verification link to.
   * @returns Resolves when the email has been dispatched (or silently when ineligible).
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: ResendVerificationDto): Promise<void> {
    const { user } = await this.userService.findOne({ email: dto.email }, { throwError: false });

    // Silent 200 for all ineligible states — callers cannot distinguish "not found"
    // from "already verified", preventing account enumeration.
    if (!user || user.isDeleted || user.emailVerified) return;

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    await this.emailService.sendEmail(
      buildResendVerificationEmail(
        { ...user, token: tokenData.token },
        { clientBaseUrl: this.configService.app.clientBaseUrl, companyName: this.configService.app.companyName },
      ),
    );

    this.activityLog.logUser({
      action: AuthAction.ResendVerificationSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });
  }
}
