import { BaseEntity } from '@/common/base/entities';
import { Column, Entity, Index } from 'typeorm';

export enum SecurityAuditEvent {
  SigninSuccess = 'signin.success',
  SigninFailure = 'signin.failure',
  Signup = 'signup',
  Logout = 'logout',
  LogoutAll = 'logout.all',
  PasswordChange = 'password.change',
  PasswordReset = 'password.reset',
  SessionRevoked = 'session.revoked',
}

/**
 * Immutable record of a security-relevant auth event.
 *
 * Rows are never updated or deleted. The combination of `userId` + `event` +
 * `createdAt` forms a non-repudiable audit trail.
 *
 * `userId` is nullable to accommodate failed sign-in attempts where the
 * identity may be unknown or unverified.
 */
@Entity('security_audit_logs')
export class SecurityAuditLog extends BaseEntity {
  @Index()
  @Column({ type: 'bigint', nullable: true })
  userId!: number | null;

  @Column({ type: 'varchar', length: 64 })
  event!: SecurityAuditEvent;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
