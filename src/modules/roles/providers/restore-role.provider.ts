import { BaseRestoreProvider } from '@/common/base';
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
 * Request-scoped provider that restores a previously soft-deleted {@link Role} entity.
 *
 * Throws a 400 error if the target role is not currently in a deleted state.
 * Emits a {@link RoleAction.RoleRestored} activity-log entry after a successful restore.
 *
 * @module Role
 */
@Injectable({ scope: Scope.REQUEST })
export class RestoreRoleProvider extends BaseRestoreProvider<Role> {
  /**
   * @param repo - Repository for {@link Role} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-restore activity log entry.
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
   * Emits a {@link RoleAction.RoleRestored} activity-log entry after the role is restored.
   *
   * @param entity - The restored {@link Role} entity.
   */
  protected override afterRestore(entity: Role): Promise<void> {
    this.activityLog.logUser({
      action: RoleAction.RoleRestored,
      userId: this.request.user?.id,
      metadata: { roleId: Number(entity.id), name: entity.name },
    });
    return Promise.resolve();
  }
}
