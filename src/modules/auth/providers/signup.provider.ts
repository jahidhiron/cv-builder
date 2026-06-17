import { ModuleName } from '@/common/enums';
import { ConfigService } from '@/config';
import { TokenType, UserRole } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { RoleService } from '@/modules/roles/role.service';
import { User } from '@/modules/users/entities/user.entity';
import { CreateUserProvider } from '@/modules/users/providers/create-user.provider';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { HashService } from '@/shared/hash/hash.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { SignupDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class SignupProvider {
  constructor(
    private readonly findOneUser: FindOneUserProvider,
    private readonly createUser: CreateUserProvider,
    private readonly roleService: RoleService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
  ) {}

  async execute(dto: SignupDto): Promise<User> {
    const existing = await this.findOneUser.execute({ email: dto.email });
    if (existing) {
      await this.errorResponse.conflict({ module: ModuleName.Auth, key: 'email-exist' });
    }

    const role = await this.roleService.findByKey(UserRole.User);
    if (!role) {
      await this.errorResponse.notFound({ module: ModuleName.Role, key: 'role-not-found' });
    }

    const passwordHash = await this.hashService.createHash(dto.password);

    const user = await this.createUser.execute({
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

    delete (user as unknown as Record<string, unknown>).password;
    return user;
  }
}
