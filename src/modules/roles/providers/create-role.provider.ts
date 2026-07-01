import { BaseCreateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { CreateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleAction } from '@/modules/roles/enums/role-action.enum';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import { ILike } from 'typeorm';

/**
 * Request-scoped provider that creates a new {@link Role} entity.
 *
 * Performs a case-insensitive uniqueness check on `name` before persisting,
 * stamps `createdBy` / `updatedBy` from the authenticated user, and emits
 * a {@link RoleAction.RoleCreated} activity-log entry after a successful save.
 *
 * @module Role
 */
@Injectable({ scope: Scope.REQUEST })
export class CreateRoleProvider extends BaseCreateProvider<Role, CreateRoleDto> {
  /**
   * @param repo - Repository for {@link Role} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-create activity log entry.
   */
  constructor(
    repo: RoleRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.Role, repo, errorResponse);
  }

  /**
   * Checks that no existing role shares the same name (case-insensitive).
   * Throws a conflict error via the base class if a duplicate is found.
   *
   * @param dto - Incoming creation payload.
   */
  protected override async beforeCreate(dto: CreateRoleDto): Promise<void> {
    await this.findOne({ name: ILike(dto.name) });
  }

  /**
   * Merges the DTO with audit fields derived from the current user.
   *
   * @param dto - Validated creation payload.
   * @returns A partial {@link Role} entity ready for persistence.
   */
  protected override buildPayload(dto: CreateRoleDto): DeepPartial<Role> {
    const userId = this.request.user?.id;
    return { ...dto, createdBy: userId, updatedBy: userId };
  }

  /**
   * Emits a {@link RoleAction.RoleCreated} activity-log entry after the role is persisted.
   *
   * @param entity - The newly created {@link Role} entity.
   */
  protected override afterCreate(entity: Role): Promise<void> {
    this.activityLog.logUser({
      action: RoleAction.RoleCreated,
      userId: this.request.user?.id,
      metadata: { roleId: Number(entity.id), name: entity.name },
    });
    return Promise.resolve();
  }
}
