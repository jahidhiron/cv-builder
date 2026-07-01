import { BaseCreateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { RoleService } from '@/modules/roles/role.service';
import { CreateUserDto } from '@/modules/users/dtos/create-user.dto';
import { User } from '@/modules/users/entities/user.entity';
import { UserAction } from '@/modules/users/enums/user-action.enum';
import { buildCreateUserEmail } from '@/modules/users/mail';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ConfigService } from '@/config';
import { HashService } from '@/shared/hash/hash.service';
import { MailService } from '@/shared/mail/mail.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { DeepPartial } from 'typeorm';

/**
 * Creates and persists a new {@link User} record.
 *
 * Provides two creation paths:
 * - **`execute(data)`** — thin low-level insert consumed by the self-service
 *   signup and OAuth flows. The caller is responsible for pre-processing the
 *   payload (password hashing, role resolution, `emailVerified` flag).
 * - **`create(dto)`** — full admin-facing flow that handles duplicate
 *   detection, role validation, password generation/hashing, activity
 *   logging, and optional welcome-email delivery in a single call.
 */
@Injectable()
export class CreateUserProvider extends BaseCreateProvider<User, DeepPartial<User>> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    private readonly roleService: RoleService,
    private readonly hashService: HashService,
    private readonly activityLog: ActivityLogService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Creates a new user account on behalf of a super-admin.
   *
   * Execution order:
   * 1. **Duplicate check** — throws 409 when `dto.email` is already registered.
   * 2. **Role validation** — throws 404 when `dto.roleId` does not exist.
   * 3. **Password resolution** — uses `dto.password` when supplied; otherwise
   *    generates a cryptographically random 16-character hex password.
   * 4. **Password hashing** — derives a secure hash of the plain-text password.
   * 5. **User creation** — persists the record with `emailVerified = true`
   *    (admin-created accounts skip the email-verification step).
   * 6. **Activity log** — emits a `UserCreated` entry.
   * 7. **Welcome email** — when `dto.sendEmail` is `true`, delivers a welcome
   *    email to the new user containing their login email and password.
   *
   * @param dto            - Validated admin create payload.
   * @param dto.name       - Display name of the new user.
   * @param dto.email      - Email address (login identifier); must be unique.
   * @param dto.roleId     - ID of the role to assign; must exist and not be deleted.
   * @param dto.password   - Optional plain-text password. Auto-generated when omitted.
   * @param dto.sendEmail  - When `true`, sends the welcome email with credentials.
   * @returns `{ user }` — the newly created user record.
   * @throws {ConflictException} When `dto.email` is already registered.
   * @throws {NotFoundException} When `dto.roleId` does not match any active role.
   */
  async create(dto: CreateUserDto): Promise<{ user: User }> {
    const emailTaken = await this.repo.exists({ email: dto.email });
    if (emailTaken) {
      return this.errorResponse.conflict({ module: ModuleName.User, key: 'email-taken' });
    }

    await this.roleService.findOne({ id: dto.roleId, isDeleted: false });

    const plainPassword = dto.password ?? randomBytes(8).toString('hex');
    const passwordHash = await this.hashService.createHash(plainPassword);

    const user = await this.execute({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
      roleId: dto.roleId,
      emailVerified: true,
    } as Partial<User>);

    this.activityLog.logUser({
      action: UserAction.UserCreated,
      userId: user.id,
      metadata: { email: user.email, roleId: dto.roleId },
    });

    if (dto.sendEmail) {
      await this.mailService.sendEmail(
        buildCreateUserEmail(
          { name: user.name, email: user.email, password: plainPassword },
          { clientBaseUrl: this.configService.app.clientBaseUrl },
        ),
      );
    }

    return { user };
  }
}
