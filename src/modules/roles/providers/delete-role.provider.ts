import { BaseDeleteProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleAction } from '@/modules/roles/enums/role-action.enum';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Request-scoped provider that soft- or hard-deletes a {@link Role} entity.
 *
 * Guards the system-reserved `"user"` and `"admin"` roles — any attempt to delete
 * them throws a 403 Forbidden error. Emits a {@link RoleAction.RoleDeleted}
 * activity-log entry after a successful delete, including whether it was a hard delete.
 *
 * @module Role
 */
@Injectable({ scope: Scope.REQUEST })
export class DeleteRoleProvider extends BaseDeleteProvider<Role> {
  /**
   * @param repo - Repository for {@link Role} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-delete activity log entry.
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
   * Prevents deletion of system-reserved roles (`"user"` and `"admin"`).
   *
   * @param role - The {@link Role} entity targeted for deletion.
   * @throws {ForbiddenException} When the role name is `"user"` or `"admin"` (case-insensitive).
   */
  protected override async beforeDelete(role: Role): Promise<void> {
    if (['user', 'admin'].includes(role.name.toLowerCase())) {
      await this.errorResponse.forbidden({ module: this.module, key: 'role-protected' });
    }
  }

  /**
   * Emits a {@link RoleAction.RoleDeleted} activity-log entry after the role is deleted.
   *
   * @param entity - The deleted {@link Role} entity.
   * @param force - `true` when the row was permanently removed; `false` for a soft delete.
   */
  protected override afterDelete(entity: Role, force: boolean): Promise<void> {
    this.activityLog.logUser({
      action: RoleAction.RoleDeleted,
      userId: this.request.user?.id,
      metadata: { roleId: Number(entity.id), name: entity.name, force },
    });
    return Promise.resolve();
  }
}
