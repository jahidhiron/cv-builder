import { ModuleName } from '@/common/enums';
import { TokenType, UserRole } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ConfigService } from '@/config';
import { HashService } from '@/shared/hash/hash.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { SignupDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class SignupProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly roleRepo: RoleRepository,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
  ) {}

  async execute(dto: SignupDto): Promise<User> {
    const existing = await this.userRepo.findOne({ email: dto.email });
    if (existing) {
      await this.errorResponse.conflict({ module: ModuleName.Auth, key: 'email-exist' });
    }

    const role = await this.roleRepo.findOne({ key: UserRole.User });
    if (!role) {
      await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
    }

    const passwordHash = await this.hashService.createHash(dto.password);

    const user = await this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      roleId: role!.id,
      emailVerified: false,
    } as Partial<User>);

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    const verifyUrl = `${this.configService.app.clientBaseUrl}/auth/verify-email?email=${user.email}&token=${tokenData.data.token}`;
    const emailParams: SendEmailParams = {
      module: ModuleName.Auth,
      template: 'signup',
      to: user.email,
      subject: 'Verify Your Account',
      context: {
        name: user.name,
        verifyUrl,
        logoUrl: this.configService.mail.logoUrl,
        supportEmail: this.configService.mail.supportEmail,
      },
    };
    await this.emailService.sendEmail(emailParams);

    return user;
  }
}
