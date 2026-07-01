import type { FindOneOptions } from '@/common/base';
import { BaseFindOneProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Retrieves a single {@link Role} by any `FindOptionsWhere<Role>` criteria.
 *
 * Delegates to {@link BaseFindOneProvider#findOne}, which throws a 404
 * `HttpException` when no matching row is found — unless the caller sets
 * `options.throwError` to `false`, in which case `null` is returned instead.
 *
 * System logging is handled by the `@SystemLog` decorator via the module-level
 * registry; no `ActivityLogService` constructor injection is required.
 *
 */
@Injectable({ scope: Scope.REQUEST })
export class FindOneRoleProvider extends BaseFindOneProvider<Role> {
  constructor(
    repo: RoleRepository,
    errorResponse: ErrorResponse,
  ) {
    super(ModuleName.Role, repo, errorResponse);
  }

  /**
   * Looks up a single role matching `where`.
   *
   * @param where   - TypeORM `FindOptionsWhere<Role>` filter conditions.
   * @param options - Optional relations, column selection, sort order, and
   *                  error-handling toggle (`throwError` defaults to `true`).
   * @returns The matched {@link Role}, or `null` when `options.throwError` is
   *          `false` and no row exists.
   * @throws {NotFoundException} When no matching role is found and
   *         `options.throwError` is `true` (the default).
   */
  @SystemLog(ModuleName.Role)
  override async execute<TThrow extends boolean = true>(
    where: FindOptionsWhere<Role>,
    options?: FindOneOptions<Role, TThrow>,
  ): Promise<TThrow extends false ? Role | null : Role> {
    return this.findOne(where, options);
  }
}