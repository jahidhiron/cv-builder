import { ModuleName } from '@/common/base/enums';
import { BasePaginatedListProvider } from '@/common/base';
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
 * Returns a paginated list of users, searching across `name` and `email`.
 * Excludes the current authenticated user from results via the request context.
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

  protected override buildParams(dto: UserListQueryDto): PaginatedListParams<User> {
    const currentUserId = this.request.user?.id;
    return {
      ...super.buildParams(dto),
      searchBy: ['name', 'email'],
      ...(currentUserId !== undefined && { query: { id: { $ne: currentUserId } } }),
    };
  }
}
