import { BaseEntity } from '@/common/entities';
import { Column, Entity } from 'typeorm';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @Column({ type: 'bigint' })
  roleId!: number;

  @Column({ type: 'bigint' })
  permissionId!: number;
}
