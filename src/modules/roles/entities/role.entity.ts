import { BaseSoftDeleteEntity } from '@/common/entities';
import { Column, Entity } from 'typeorm';

@Entity('roles')
export class Role extends BaseSoftDeleteEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 50, unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: true })
  createdBy?: number | null;

  @Column({ type: 'bigint', nullable: true })
  updatedBy?: number | null;
}
