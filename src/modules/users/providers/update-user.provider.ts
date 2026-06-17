import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';

@Injectable()
export class UpdateUserProvider {
  constructor(private readonly userRepo: UserRepository) {}

  execute(where: FindOptionsWhere<User>, data: DeepPartial<User>): Promise<User | null> {
    return this.userRepo.update(where, data);
  }
}
