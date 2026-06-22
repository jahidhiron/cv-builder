import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';
import { TokenType, UserRole } from '@/modules/auth/enums';
import { TokenPayload } from '@/modules/auth/interfaces';
import { AuditLogProvider } from '@/modules/auth/providers/audit-log.provider';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { RoleService } from '@/modules/roles/role.service';
import { User } from '@/modules/users/entities/user.entity';
import { CreateUserProvider } from '@/modules/users/providers/create-user.provider';
import { FindOneUserProvider } from '@/modules/users/providers/find-one-user.provider';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { SendEmailParams } from '@/shared/mail/interfaces';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { SignupDto } from '../dtos';

/**
 * Handles the email/password registration flow.
 *
 * Steps:
 * 1. Rejects duplicate email addresses.
 * 2. Resolves the default `User` role (fails loudly when the role seed is missing).
 * 3. Hashes the password with scrypt.
 * 4. Persists the new user.
 * 5. Generates an email-verification token.
 * 6. Sends the verification email.
 */
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
    private readonly savePasswordHistory: SavePasswordHistoryProvider,
    private readonly hibpService: HibpService,
    private readonly auditLog: AuditLogProvider,
  ) {}

  /**
   * @param dto - Registration payload (name, email, password).
   * @returns The newly created user.
   * @throws {ConflictException} When the email is already registered.
   * @throws {NotFoundException} When the default `User` role is missing from the database.
   */
  async execute(dto: SignupDto): Promise<User> {
    const existing = await this.findOneUser.execute({ email: dto.email }, {throwError: false});
    if (existing) {
      return this.errorResponse.conflict({ module: ModuleName.Auth, key: 'email-exist' });
    }

    const { role } = await this.roleService.findOne({ name: UserRole.User, isDeleted: false });

    await this.hibpService.checkPassword(dto.password);

    const passwordHash = await this.hashService.createHash(dto.password);

    const user = await this.createUser.execute({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      roleId: role.id,
      emailVerified: false,
    } as Partial<User>);

    await this.savePasswordHistory.execute({ userId: user.id, passwordHash });
    this.auditLog.log({ event: SecurityAuditEvent.Signup, userId: user.id });

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    const verifyUrl = `${this.configService.app.clientBaseUrl}/auth/verify-email?email=${user.email}&token=${tokenData.token}`;
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
