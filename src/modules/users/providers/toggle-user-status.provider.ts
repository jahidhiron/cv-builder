import { ModuleName } from '@/common/enums';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class ToggleUserStatusProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(id: number, isActive: boolean): Promise<User> {
    const user = await this.userRepo.findOne({ id });
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.User, key: 'user-not-found' });
    }

    if (isActive && (user as User).isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-active' });
    }

    if (!isActive && !(user as User).isActive) {
      await this.errorResponse.conflict({ module: ModuleName.User, key: 'user-already-inactive' });
    }

    const updated = await this.userRepo.update({ id }, { isActive });
    return updated!;
  }
}
