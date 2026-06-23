import { ConfigService } from '@/config';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { UserService } from '@/modules/users/user.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
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
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const { user } = await this.userService.findOne({ email: dto.email }, { throwError: false });

    // Silently succeed for any ineligible state to prevent email enumeration.
    // The client always receives a 200 regardless of whether an email was sent.
    if (!user || user.isDeleted || !user.isActive || !user.emailVerified) return;

    const tokenPayload: TokenPayload = { type: TokenType.ForgotPassword, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    const { app, mail } = this.configService;
    const resetUrl = `${app.clientBaseUrl}/auth/reset-password?email=${user.email}&token=${tokenData.token}`;
    const emailParams: SendEmailParams = {
      module: 'auth' as never,
      template: 'forgot-password',
      to: user.email,
      subject: `Action required: Reset Your ${app.companyName} Account Password`,
      context: {
        name: user.name,
        resetUrl,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);
  }
}
