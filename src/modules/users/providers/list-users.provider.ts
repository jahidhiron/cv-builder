import { UserListQueryDto } from '@/modules/users/dtos';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ListUsersProvider {
  constructor(private readonly userRepo: UserRepository) {}

  execute(dto: UserListQueryDto, excludeUserId: number) {
    return this.userRepo.paginatedList({
      page: dto.page,
      limit: dto.limit,
      q: dto.q,
      searchBy: ['name', 'email'],
      query: { id: { $ne: excludeUserId } },
    });
  }
}
