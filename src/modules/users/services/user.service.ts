import { User } from '@/modules/users/entities/user.entity';
import { UserRepository } from '@/modules/users/repositories/user.repository';
import { Injectable, Scope } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';

/**
 * Public service for the `users` module.
 *
 * Acts as a thin, request-scoped facade over {@link UserRepository} so that
 * other modules (e.g. `auth`) do not couple themselves directly to the
 * repository. Each method exposes only the data-access shape required by
 * current consumers; add new methods here when a new use-case appears.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  /** Find a user by primary key. Returns `null` when not found. */
  findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ id });
  }

  /** Find a user by email. Returns `null` when not found. */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ email });
  }

  /** Find a user by id, including the `password` column (normally hidden). */
  findByIdWithPassword(id: number): Promise<User | null> {
    return this.userRepo.findWithPassword(id);
  }

  /** Find a user by email, including the `password` column (normally hidden). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo.findByEmailWithPassword(email);
  }

  /** Create and persist a new user. */
  create(data: Partial<User>): Promise<User> {
    return this.userRepo.create(data as Parameters<UserRepository['create']>[0]);
  }

  /** Update an existing user matched by `where`. Returns the updated entity, or `null`. */
  update(where: FindOptionsWhere<User>, data: Partial<User>): Promise<User | null> {
    return this.userRepo.update(where, data);
  }
}
