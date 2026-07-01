import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { UserService } from '@/modules/users/user.service';
import { buildForgotPasswordEmail } from '@/modules/auth/mail';
import { MailService } from '@/shared/mail/mail.service';
import { Injectable, Scope } from '@nestjs/common';
import { ForgotPasswordDto } from '../dtos';

/**
 * Initiates the password-reset flow by generating a one-time token and
 * emailing a reset link to the user.
 *
 * Only accounts with a verified, active, non-deleted email are eligible.
 * For any ineligible state (unknown email, deleted account, etc.) the method
 * returns silently with a 200 — this prevents email-enumeration attacks where
 * an attacker probes whether an address is registered.
 */
@Injectable({ scope: Scope.REQUEST })
export class ForgotPasswordProvider {
  constructor(
    private readonly userService: UserService,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Initiates the password-reset flow for the given email address.
   *
   * Steps:
   * 1. **User lookup** — resolves the user by email with `throwError: false`.
   * 2. **Eligibility guard** — silently returns 200 if the user does not exist,
   *    is deleted, inactive, or unverified, to prevent email enumeration.
   * 3. **Token creation** — generates a new one-time `ForgotPassword` token.
   * 4. **Email dispatch** — sends the password-reset link to the user's email address.
   *
   * @param dto - Contains the `email` to send the reset link to.
   * @returns Resolves when the email has been dispatched (or silently when ineligible).
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: ForgotPasswordDto): Promise<void> {
    const { user } = await this.userService.findOne({ email: dto.email }, { throwError: false });

    // Silent 200 for all ineligible states — callers cannot distinguish "not found"
    // from "deleted" or "unverified", preventing email enumeration.
    if (!user || user.isDeleted || !user.isActive || !user.emailVerified) return;

    const tokenPayload: TokenPayload = { type: TokenType.ForgotPassword, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    await this.emailService.sendEmail(
      buildForgotPasswordEmail(
        { ...user, token: tokenData.token },
        { clientBaseUrl: this.configService.app.clientBaseUrl, companyName: this.configService.app.companyName },
      ),
    );

    this.activityLog.logUser({
      action: AuthAction.ForgotPasswordSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });
  }
}
