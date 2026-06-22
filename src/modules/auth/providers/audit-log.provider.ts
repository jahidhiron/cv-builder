import { ModuleName } from '@/common/base/enums';
import { BaseCreateProvider } from '@/common/base/providers/base-create.provider';
import { AppLogger } from '@/config/logger';
import { SecurityAuditLog } from '@/modules/auth/entities/security-audit-log.entity';
import { AuditLogParams } from '@/modules/auth/providers/interfaces';
import { SecurityAuditLogRepository } from '@/modules/auth/repositories/security-audit-log.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Fire-and-forget audit logger for security events.
 *
 * All writes are non-blocking — errors are logged but never re-thrown so
 * that a failed audit write can never break the auth flow itself.
 */
@Injectable()
export class AuditLogProvider extends BaseCreateProvider<SecurityAuditLog, AuditLogParams> {
  constructor(
    auditLogRepo: SecurityAuditLogRepository,
    errorResponse: ErrorResponse,
    private readonly logger: AppLogger,
  ) {
    super(ModuleName.Auth, auditLogRepo, errorResponse);
  }

  protected override buildPayload(dto: AuditLogParams): DeepPartial<SecurityAuditLog> {
    const { event, userId = null, ip = null, userAgent = null, metadata = null } = dto;
    return { event, userId, ip, userAgent, metadata };
  }

  log(params: AuditLogParams): void {
    this.execute(params).catch((err: unknown) => {
      this.logger.error(
        `Audit log write failed for event "${params.event}": ${(err as Error).message}`,
      );
    });
  }
}
