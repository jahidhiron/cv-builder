import type { FindOneOptions } from '@/common/base';
import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { PermissionRepository } from '@/modules/permissions/repositories/permission.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Provider that retrieves a single {@link Permission} entity by any `FindOptionsWhere<Permission>` criteria.
 *
 * Delegates to {@link BaseFindOneProvider#findOne}, which throws a 404 when no matching
 * row is found — unless the caller sets `options.throwError` to `false`, in which case
 * `null` is returned instead.
 *
 * @module Permission
 */
@Injectable()
export class FindOnePermissionProvider extends BaseFindOneProvider<Permission> {
  /**
   * @param repo - Repository for {@link Permission} entities.
   * @param errorResponse - Shared utility for building standardised error responses.
   */
  constructor(
    repo: PermissionRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Permission, repo, errorResponse);
  }

  /**
   * Looks up a single permission matching `where`.
   *
   * @param where - TypeORM `FindOptionsWhere<Permission>` filter conditions.
   * @param options - Optional relations, column selection, sort order, and
   *                  error-handling toggle (`throwError` defaults to `true`).
   * @returns The matched {@link Permission}, or `null` when `options.throwError` is
   *          `false` and no row exists.
   * @throws {NotFoundException} When no matching permission is found and
   *         `options.throwError` is `true` (the default).
   */
  @SystemLog(ModuleName.Permission)
  override async execute<TThrow extends boolean = true>(
    where: FindOptionsWhere<Permission>,
    options?: FindOneOptions<Permission, TThrow>,
  ): Promise<TThrow extends false ? Permission | null : Permission> {
    return this.findOne(where, options);
  }
}
