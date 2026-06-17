import { BaseTimestampEntity } from '@/common/entities';
import { Column, Entity } from 'typeorm';

@Entity('permissions')
export class Permission extends BaseTimestampEntity {
  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ length: 100, unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'bigint', nullable: true })
  createdBy?: number | null;

  @Column({ type: 'bigint', nullable: true })
  updatedBy?: number | null;
}
