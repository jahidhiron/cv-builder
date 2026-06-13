import { ModuleName } from '@/common/enums';
import { TokenType } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ConfigService } from '@/config';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ForgotPasswordDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class ForgotPasswordProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly errorResponse: ErrorResponse,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ email: dto.email });
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.Auth, key: 'user-not-found' });
    }
    if (!user!.emailVerified) {
      await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'user-not-verified' });
    }

    const tokenPayload: TokenPayload = { type: TokenType.ForgotPassword, user: user! };
    const tokenData = await this.createToken.execute(tokenPayload);

    const { app, mail } = this.configService;
    const resetUrl = `${app.clientBaseUrl}/auth/reset-password?email=${user!.email}&token=${tokenData.data.token}`;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'forgot-password',
      to: user!.email,
      subject: `Action required: Reset Your ${app.companyName} Account Password`,
      context: {
        name: user!.name,
        resetUrl,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);
  }
}
