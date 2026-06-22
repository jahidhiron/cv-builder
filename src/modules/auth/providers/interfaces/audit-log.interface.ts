import { SecurityAuditEvent } from '@/modules/auth/entities/security-audit-log.entity';

export interface AuditLogParams {
  event: SecurityAuditEvent;
  userId?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}
