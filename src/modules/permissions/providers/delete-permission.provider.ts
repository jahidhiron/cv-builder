import { BaseDeleteProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Request-scoped provider that permanently deletes a {@link Permission} entity.
 *
 * Always performs a hard delete — `Permission` has no soft-delete columns.
 * Guards system-reserved permissions whose keys start with `roles:`, `users:`,
 * or `permissions:`, throwing a 403 Forbidden error if matched.
 * Emits a {@link PermissionAction.PermissionDeleted} activity-log entry after a successful delete.
 *
 * @module Permission
 */
@Injectable({ scope: Scope.REQUEST })
export class DeletePermissionProvider extends BaseDeleteProvider<Permission> {
  /**
   * @param repo - Repository for {@link Permission} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-delete activity log entry.
   */
  constructor(
    repo: PermissionRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
    private readonly activityLog: ActivityLogService,
  ) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  /**
   * Prevents deletion of system-reserved permissions.
   *
   * @param permission - The {@link Permission} entity targeted for deletion.
   * @throws {ForbiddenException} When the key starts with `roles:`, `users:`, or `permissions:`.
   */
  protected override async beforeDelete(permission: Permission): Promise<void> {
    if (permission.key.match(/^(roles|users|permissions):/)) {
      await this.errorResponse.forbidden({ module: this.module, key: 'permission-protected' });
    }
  }

  /**
   * Emits a {@link PermissionAction.PermissionDeleted} activity-log entry after the permission is deleted.
   *
   * @param entity - The deleted {@link Permission} entity.
   * @param force - Always `true` for permissions; included for base-class signature compatibility.
   */
  protected override afterDelete(entity: Permission, force: boolean): Promise<void> {
    this.activityLog.logUser({
      action: PermissionAction.PermissionDeleted,
      userId: this.request.user?.id,
      metadata: { permissionId: Number(entity.id), key: entity.key, force },
    });
    return Promise.resolve();
  }
}
