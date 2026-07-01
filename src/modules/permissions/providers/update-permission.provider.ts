import { BaseUpdateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { UpdatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';
import { Not } from 'typeorm';

/**
 * Request-scoped provider that updates an existing {@link Permission} entity.
 *
 * Before persisting:
 * - Guards system-reserved permissions whose keys start with `roles:`, `users:`, or `permissions:`.
 * - When `dto.key` is provided, checks that no other permission already owns that key,
 *   excluding the current record via `Not(entity.id)`.
 *
 * Stamps `updatedBy` from the authenticated user and emits a
 * {@link PermissionAction.PermissionUpdated} activity-log entry after a successful save.
 *
 * @module Permission
 */
@Injectable({ scope: Scope.REQUEST })
export class UpdatePermissionProvider extends BaseUpdateProvider<Permission, UpdatePermissionDto> {
  /**
   * @param repo - Repository for {@link Permission} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-update activity log entry.
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
   * Guards system-reserved permissions and checks key uniqueness before the update is applied.
   *
   * Throws 403 when the existing key belongs to a protected domain (`roles:`, `users:`,
   * `permissions:`). Throws 409 when `dto.key` conflicts with another permission's key.
   *
   * @param entity - The existing {@link Permission} entity being updated.
   * @param dto - The incoming update payload.
   */
  protected override async beforeUpdate(
    entity: Permission,
    dto: UpdatePermissionDto,
  ): Promise<void> {
    if (entity.key.match(/^(roles|users|permissions):/)) {
      await this.errorResponse.forbidden({ module: this.module, key: 'permission-protected' });
    }
    if (dto.key) {
      const conflict = await this.repo.findOne({ key: dto.key, id: Not(entity.id) });
      if (conflict) {
        await this.errorResponse.conflict({ module: this.module, key: 'permission-key-exists' });
      }
    }
  }

  /**
   * Merges the DTO with the `updatedBy` audit field derived from the current user.
   *
   * @param dto - Validated update payload.
   * @returns A partial {@link Permission} entity ready for persistence.
   */
  protected override buildPayload(dto: UpdatePermissionDto): DeepPartial<Permission> {
    return { ...dto, updatedBy: this.request.user?.id };
  }

  /**
   * Emits a {@link PermissionAction.PermissionUpdated} activity-log entry after the permission is persisted.
   *
   * @param entity - The updated {@link Permission} entity.
   */
  protected override afterUpdate(entity: Permission): Promise<void> {
    this.activityLog.logUser({
      action: PermissionAction.PermissionUpdated,
      userId: this.request.user?.id,
      metadata: { permissionId: Number(entity.id), key: entity.key },
    });
    return Promise.resolve();
  }
}
