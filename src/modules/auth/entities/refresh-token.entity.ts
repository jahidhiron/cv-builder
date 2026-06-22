import { BaseEntity } from '@/common/base/entities';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Represents a persisted refresh token (stored as a scrypt hash, never plaintext).
 *
 * `familyId` groups all tokens issued for the same device fingerprint (base64 of
 * IP + UA). When token reuse is detected, the entire family is revoked to invalidate
 * all sessions on that device.
 *
 * `revokedAt` / `revokedReason` form a soft-revocation audit trail — rows are only
 * hard-deleted in bulk by `CleanupRefreshTokenProvider` at sign-in time.
 */
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column({ length: 255, unique: true })
  tokenHash!: string;

  @Column({ type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  familyId!: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  /** When this device session started (copied from the first token in the family).
   *  Used to enforce the absolute session max-lifetime regardless of rotation count. */
  @Column({ type: 'timestamptz', nullable: true })
  sessionStartedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  revokedReason!: string | null;
}
