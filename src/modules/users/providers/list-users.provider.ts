import { BasePaginatedListProvider } from '@/common/base';
import { ModuleName } from '@/common/base/enums';
import { PaginatedListParams } from '@/common/base/repositories/interfaces';
import { UserPayload } from '@/modules/auth/interfaces';
import { UserListQueryDto } from '@/modules/users/dtos';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Returns a paginated, searchable list of {@link User} records.
 *
 * Extends {@link BasePaginatedListProvider} with two user-specific behaviours:
 * - **Full-text search** across the `name` and `email` columns.
 * - **Self-exclusion** — the authenticated user is stripped from results so
 *   admin UIs never show the caller in the list they manage.
 *
 * Pagination and filtering parameters are forwarded from {@link UserListQueryDto}
 * via the base `buildParams` implementation.
 */
@Injectable({ scope: Scope.REQUEST })
export class ListUsersProvider extends BasePaginatedListProvider<User, UserListQueryDto> {
  constructor(
    repo: UserRepository,
    errorResponse: ErrorResponse,
    @Inject(REQUEST) private readonly request: Request & { user?: UserPayload },
  ) {
    super(ModuleName.User, repo, errorResponse);
  }

  /**
   * Builds the repository query parameters for a paginated user listing.
   *
   * Merges the base pagination params from the DTO with a fixed
   * `searchBy: ['name', 'email']` and, when the request carries an
   * authenticated user, a `$ne` filter that excludes their own record.
   *
   * @param dto - Validated query parameters (page, limit, search term, etc.).
   * @returns The fully assembled {@link PaginatedListParams} passed to the
   *          repository.
   */
  protected override buildParams(dto: UserListQueryDto): PaginatedListParams<User> {
    const currentUserId = this.request.user?.id;
    return {
      ...super.buildParams(dto),
      searchBy: ['name', 'email'],
      ...(currentUserId !== undefined && { query: { id: { $ne: currentUserId } } }),
    };
  }
}
