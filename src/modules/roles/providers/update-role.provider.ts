import { BaseUpdateProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { ActivityLogService } from '@/modules/activity-log/activity-log.service';
import { UserPayload } from '@/modules/auth/interfaces';
import { UpdateRoleDto } from '@/modules/roles/dtos';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleAction } from '@/modules/roles/enums/role-action.enum';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';
import { ILike, Not } from 'typeorm';

/**
 * Request-scoped provider that updates an existing {@link Role} entity.
 *
 * Before persisting, performs a case-insensitive uniqueness check on `name`,
 * excluding the current record via `Not(entity.id)` to allow no-op name updates.
 * Stamps `updatedBy` from the authenticated user and emits a
 * {@link RoleAction.RoleUpdated} activity-log entry after a successful save.
 *
 * @module Role
 */
@Injectable({ scope: Scope.REQUEST })
export class UpdateRoleProvider extends BaseUpdateProvider<Role, UpdateRoleDto> {
  /**
   * @param repo - Repository for {@link Role} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   * @param request - Express request injected via `REQUEST` token; carries the authenticated user.
   * @param activityLog - Service used to emit the post-update activity log entry.
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
   * Guards against name collisions before the update is applied.
   *
   * Runs only when `dto.name` is present. Throws a 409 conflict error if another
   * role already uses the same name (case-insensitive), excluding the current entity.
   *
   * @param entity - The existing {@link Role} entity being updated.
   * @param dto - The incoming update payload.
   */
  protected override async beforeUpdate(entity: Role, dto: UpdateRoleDto): Promise<void> {
    if (dto.name) {
      const conflict = await this.repo.findOne({
        name: ILike(dto.name),
        id: Not(entity.id),
      } as FindOptionsWhere<Role>);
      if (conflict) {
        await this.errorResponse.conflict({ module: this.module, key: 'role-name-exists' });
      }
    }
  }

  /**
   * Merges the DTO with the `updatedBy` audit field derived from the current user.
   *
   * @param dto - Validated update payload.
   * @returns A partial {@link Role} entity ready for persistence.
   */
  protected override buildPayload(dto: UpdateRoleDto): DeepPartial<Role> {
    return { ...dto, updatedBy: this.request.user?.id };
  }

  /**
   * Emits a {@link RoleAction.RoleUpdated} activity-log entry after the role is persisted.
   *
   * @param entity - The updated {@link Role} entity.
   */
  protected override afterUpdate(entity: Role): Promise<void> {
    this.activityLog.logUser({
      action: RoleAction.RoleUpdated,
      userId: this.request.user?.id,
      metadata: { roleId: Number(entity.id), name: entity.name },
    });
    return Promise.resolve();
  }
}
