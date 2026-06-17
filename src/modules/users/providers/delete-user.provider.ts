import { ModuleName } from '@/common/enums';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class DeleteUserProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number, currentUserId: number, force = false): Promise<void> {
    const user = force
      ? await this.userRepo.remove({ id })
      : await this.userRepo.softDelete({ id }, currentUserId);

    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }
  }
}
