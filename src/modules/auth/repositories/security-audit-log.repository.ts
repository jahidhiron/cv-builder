import { BaseRepository } from '@/common/base/repositories/base.repository';
import { AppLogger } from '@/config/logger';
import { SecurityAuditLog } from '@/modules/auth/entities/security-audit-log.entity';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SecurityAuditLogRepository extends BaseRepository<SecurityAuditLog> {
  constructor(
    dataSource: DataSource,
    errorResponse: ErrorResponse,
    logger: AppLogger,
  ) {
    super(dataSource, SecurityAuditLog, 'security_audit_log', errorResponse, logger);
  }
}
