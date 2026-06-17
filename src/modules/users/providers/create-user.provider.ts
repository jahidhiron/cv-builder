import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

@Injectable()
export class CreateUserProvider {
  constructor(private readonly userRepo: UserRepository) {}

  execute(data: DeepPartial<User>): Promise<User> {
    return this.userRepo.create(data);
  }
}
