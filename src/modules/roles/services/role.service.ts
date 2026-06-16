import { Role } from '@/modules/roles/entities/role.entity';
import { RoleRepository } from '@/modules/roles/repositories/role.repository';
import { Injectable, Scope } from '@nestjs/common';

/**
 * Public service for the `roles` module.
 *
 * Acts as a thin, request-scoped facade over {@link RoleRepository} so that
 * other modules (e.g. `auth`) do not couple themselves directly to the
 * repository. Add new methods here when a new use-case appears.
 */
@Injectable({ scope: Scope.REQUEST })
export class RoleService {
  constructor(private readonly roleRepo: RoleRepository) {}

  /** Find a role by its `key` (e.g. `'user'`, `'admin'`). Returns `null` when not found. */
  findByKey(key: string): Promise<Role | null> {
    return this.roleRepo.findOne({ key });
  }
}
