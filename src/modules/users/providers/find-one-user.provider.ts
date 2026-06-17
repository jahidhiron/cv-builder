import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

@Injectable()
export class FindOneUserProvider {
  constructor(private readonly userRepo: UserRepository) {}

  execute(where: FindOptionsWhere<User>, options?: { withPassword?: boolean }): Promise<User | null> {
    if (options?.withPassword) {
      if (where.id !== undefined) return this.userRepo.findWithPassword(where.id as number);
      if (where.email !== undefined) return this.userRepo.findByEmailWithPassword(where.email as string);
    }
    return this.userRepo.findOne(where);
  }
}
