import { ModuleName } from '@/common/enums';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RestoreUserProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ id });
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }
    if (!user!.isDeleted) {
      await this.errorResponse.badRequest({ module: ModuleName.User, key: 'user-not-archived' });
    }

    const restored = await this.userRepo.restore({ id });
    return restored!;
  }
}
