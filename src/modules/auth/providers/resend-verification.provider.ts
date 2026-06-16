import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { UserService } from '@/modules/users/services';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ResendVerificationDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class ResendVerificationProvider {
  constructor(
    private readonly userService: UserService,
    private readonly errorResponse: ErrorResponse,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
  ) {}

  async execute(dto: ResendVerificationDto): Promise<void> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.Auth, key: 'user-not-found' });
    }
    if (user!.emailVerified) {
      await this.errorResponse.conflict({ module: ModuleName.Auth, key: 'user-already-verified' });
    }

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user: user! };
    const tokenData = await this.createToken.execute(tokenPayload);

    const { app, mail } = this.configService;
    const verifyUrl = `${app.clientBaseUrl}/auth/verify-email?email=${user!.email}&token=${tokenData.data.token}`;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'resend-verification',
      to: user!.email,
      subject: `Action required: Confirm your email address at ${app.companyName}`,
      context: {
        name: user!.name,
        verifyUrl,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);
  }
}
