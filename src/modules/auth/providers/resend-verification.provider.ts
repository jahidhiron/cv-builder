import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { SendEmailParams } from '@/shared/mail/interfaces';
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
    private readonly findOneUser: FindOneUserProvider,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
  ) {}

  async execute(dto: ResendVerificationDto): Promise<void> {
    const user = await this.findOneUser.execute({ email: dto.email }, { throwError: false });

    // Silently succeed for any ineligible state to prevent account enumeration.
    if (!user || user.isDeleted || user.emailVerified) return;

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    const { app, mail } = this.configService;
    const verifyUrl = `${app.clientBaseUrl}/auth/verify-email?email=${user.email}&token=${tokenData.token}`;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'resend-verification',
      to: user.email,
      subject: `Action required: Confirm your email address at ${app.companyName}`,
      context: {
        name: user.name,
        verifyUrl,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);
  }
}
