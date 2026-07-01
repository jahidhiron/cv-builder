import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { SystemLog } from '@/modules/activity-log/decorators';
import { LogStatus } from '@/modules/activity-log/enums';
import { TokenType, UserRole } from '@/modules/auth/enums';
import { AuthAction } from '@/modules/auth/enums/auth-action.enum';
import { TokenPayload } from '@/modules/auth/interfaces';
import { buildVerifyEmail } from '@/modules/auth/mail';
import { CreateTokenProvider } from '@/modules/auth/providers/create-token.provider';
import { SavePasswordHistoryProvider } from '@/modules/auth/providers/save-password-history.provider';
import { RoleService } from '@/modules/roles/role.service';
import { User } from '@/modules/users/entities/user.entity';
import { UserService } from '@/modules/users/user.service';
import { HashService } from '@/shared/hash/hash.service';
import { HibpService } from '@/shared/hibp/hibp.service';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { SignupDto } from '../dtos';

/**
 * Handles the end-to-end email/password registration flow.
 *
 * Orchestrates duplicate detection, role resolution, breach-password
 * rejection, user creation, password-history seeding, token issuance,
 * and verification-email dispatch in a single request-scoped unit.
 *
 * Decorated with `@SystemLog` so every invocation is recorded in the
 * activity-log regardless of outcome.
 */
@Injectable({ scope: Scope.REQUEST })
export class SignupProvider {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
    private readonly createToken: CreateTokenProvider,
    private readonly configService: ConfigService,
    private readonly emailService: MailService,
    private readonly savePasswordHistory: SavePasswordHistoryProvider,
    private readonly hibpService: HibpService,
    private readonly activityLog: ActivityLogService,
  ) {}

  /**
   * Registers a new user account and sends a verification email.
   *
   * Execution order:
   * 1. **Duplicate check** — rejects the request if the email is already
   *    registered and emits a `SignupFailed` activity-log entry.
   * 2. **Role resolution** — fetches the default `User` role; throws 404
   *    when the role seed is absent from the database.
   * 3. **Breach check** — validates the password against the HIBP dataset;
   *    rejects passwords found in known data breaches.
   * 4. **Password hashing** — derives a scrypt hash of the plaintext password.
   * 5. **User creation** — persists the new user with `emailVerified: false`.
   * 6. **Password history** — saves the initial hash so future changes can
   *    enforce reuse policies.
   * 7. **Token issuance** — generates a short-lived `VerifyEmail` JWT.
   * 8. **Email dispatch** — sends the verification email containing the
   *    deep-link back to the client.
   *
   * @param dto - Registration payload containing `name`, `email`, and `password`.
   * @returns The newly created {@link User} entity (pre-verification).
   * @throws {ConflictException} When `dto.email` is already registered.
   * @throws {NotFoundException} When the default `User` role is absent from the database.
   * @throws {BadRequestException} When `dto.password` appears in a known data breach.
   */
  @SystemLog(ModuleName.Auth)
  async execute(dto: SignupDto): Promise<{ user: User }> {
    const { exists } = await this.userService.exists({ email: dto.email });
    if (exists) {
      this.activityLog.logUser({
        action: AuthAction.SignupFailed,
        status: LogStatus.Failed,
        metadata: { email: dto.email, reason: 'email-already-registered' },
      });
      return this.errorResponse.conflict({ module: ModuleName.Auth, key: 'email-exist' });
    }

    const { role } = await this.roleService.findOne({ name: UserRole.User, isDeleted: false });

    await this.hibpService.checkPassword(dto.password);

    const passwordHash = await this.hashService.createHash(dto.password);

    const { user } = await this.userService.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      roleId: role.id,
      emailVerified: false,
    } as Partial<User>);

    await this.savePasswordHistory.execute({ userId: user.id, passwordHash });

    const tokenPayload: TokenPayload = { type: TokenType.VerifyEmail, user };
    const tokenData = await this.createToken.execute(tokenPayload);

    await this.emailService.sendEmail(
      buildVerifyEmail(
        { ...user, token: tokenData.token },
        { clientBaseUrl: this.configService.app.clientBaseUrl },
      ),
    );

    this.activityLog.logUser({
      action: AuthAction.SignupSuccess,
      userId: user.id,
      metadata: { email: user.email },
    });

    return { user };
  }
}
