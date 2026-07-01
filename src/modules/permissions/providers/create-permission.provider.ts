import { BaseCreateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { CreatePermissionDto } from '@/modules/permissions/dtos';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionAction } from '@/modules/permissions/enums/permission-action.enum';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial } from 'typeorm';

/**
 * Request-scoped provider that creates a new {@link Permission} entity.
 *
 * Enforces global uniqueness on `key` before persisting. Permission keys follow
 * the `domain:action` convention (e.g. `users:read`) and are embedded in JWTs
 * at sign-in, so they must be stable and unique across the system.
 * Stamps `createdBy` / `updatedBy` from the authenticated user and emits a
 * {@link PermissionAction.PermissionCreated} activity-log entry after a successful save.
 *
 * @module Permission
 */
@Injectable({ scope: Scope.REQUEST })
export class CreatePermissionProvider extends BaseCreateProvider<Permission, CreatePermissionDto> {
  /**
   * @param repo - Repository for {@link Permission} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-create activity log entry.
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
   * Checks that no existing permission shares the same `key`.
   * Throws a 409 conflict error if a duplicate is found.
   *
   * @param dto - Incoming creation payload.
   */
  protected override async beforeCreate(dto: CreatePermissionDto): Promise<void> {
    const existing = await this.repo.findOne({ key: dto.key });
    if (existing) {
      await this.errorResponse.conflict({ module: this.module, key: 'permission-key-exists' });
    }
  }

  /**
   * Merges the DTO with audit fields derived from the current user.
   *
   * @param dto - Validated creation payload.
   * @returns A partial {@link Permission} entity ready for persistence.
   */
  protected override buildPayload(dto: CreatePermissionDto): DeepPartial<Permission> {
    const userId = this.request.user?.id;
    return { ...dto, createdBy: userId, updatedBy: userId };
  }

  /**
   * Emits a {@link PermissionAction.PermissionCreated} activity-log entry after the permission is persisted.
   *
   * @param entity - The newly created {@link Permission} entity.
   */
  protected override afterCreate(entity: Permission): Promise<void> {
    this.activityLog.logUser({
      action: PermissionAction.PermissionCreated,
      userId: this.request.user?.id,
      metadata: { permissionId: Number(entity.id), key: entity.key },
    });
    return Promise.resolve();
  }
}
