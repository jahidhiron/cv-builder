import { ModuleName } from '@/common/enums';
import { UserPayload } from '@/modules/auth/interfaces';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { HashService } from '@/shared/hash/hash.service';
import { ErrorResponse } from '@/shared/response';
import { Injectable, Scope } from '@nestjs/common';
import { ChangePasswordDto } from '../dtos';

@Injectable({ scope: Scope.REQUEST })
export class ChangePasswordProvider {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hashService: HashService,
    private readonly errorResponse: ErrorResponse,
  ) {}

  async execute(dto: ChangePasswordDto, currentUser: UserPayload): Promise<void> {
    const user = await this.userRepo.findWithPassword(currentUser.id);
    if (!user) {
      await this.errorResponse.notFound({ module: ModuleName.Auth, key: 'user-not-found' });
    }
    if (!user!.password) {
      await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'no-password-set' });
    }

    const isMatch = await this.hashService.verify(user!.password!, dto.oldPassword);
    if (!isMatch) {
      await this.errorResponse.forbidden({ module: ModuleName.Auth, key: 'old-password-not-match' });
    }

    const newHash = await this.hashService.createHash(dto.newPassword);
    await this.userRepo.update({ id: user!.id }, { password: newHash });
  }
}
