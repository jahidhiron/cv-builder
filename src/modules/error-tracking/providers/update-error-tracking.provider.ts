import { ModuleName } from '@/common/base/enums';
import { BaseUpdateProvider } from '@/common/base';
import { ServerError } from '@/modules/error-tracking/entities/server-error.entity';
import { ServerErrorRepository } from '@/modules/error-tracking/repositories/server-error.repository';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import type { DeepPartial } from 'typeorm';

/**
 * Updates a server-error record by `fingerprint`.
 * Used to stamp `emailSentAt` after the first-occurrence admin alert is sent.
 */
@Injectable()
export class UpdateErrorTrackingProvider extends BaseUpdateProvider<ServerError, DeepPartial<ServerError>> {
  constructor(repo: ServerErrorRepository, errorResponse: ErrorResponse) {
    super(ModuleName.ErrorTracking, repo, errorResponse);
  }
}
