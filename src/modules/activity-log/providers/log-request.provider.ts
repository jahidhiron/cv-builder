import { ModuleName } from '@/common/base/enums';
import { AppLogger } from '@/config/logger';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { DeepPartial, FindOptionsWhere } from 'typeorm';
import type { RequestContext } from '../context';
import { RequestLog } from '../entities/request-log.entity';
import { RequestLogRepository } from '../repositories';
import { snapshot } from '../utils';

/**
 * Standalone helper for creating and updating `request_logs` rows outside of
 * {@link RequestLogInterceptor}'s own direct-mode insert/update path.
 *
 * Exported by `ActivityLogModule` for modules that need to log a request
 * manually (e.g. RabbitMQ consumers processing a request outside the normal
 * HTTP interceptor chain).
 */
@Injectable()
export class LogRequestProvider {
  /**
   * @param repo   - Repository used to create and update `request_logs` rows.
   * @param logger - Application logger used to report `safeUpdate` failures.
   */
  constructor(
    private readonly repo: RequestLogRepository,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Inserts a new `request_logs` row for the given request context.
   *
   * @param ctx - Request context carrying `requestId`, `ip`, `userAgent`, and `userId`.
   * @param req - The incoming Express request.
   * @returns The inserted row's `id`.
   */
  async create(ctx: RequestContext, req: Request): Promise<number> {
    const payload = {
      requestId: ctx.requestId,
      method: req.method,
      endpoint: ctx.endpoint ?? `${req.method} ${req.path}`,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      userId: ctx.userId,
      body: snapshot(req.body),
      queryParams: snapshot(req.query),
      statusCode: null,
      durationMs: null,
    } as DeepPartial<RequestLog>;
    const log = await this.repo.create(payload);
    return log.id;
  }

  /**
   * Fire-and-forget update that fills in `statusCode` and `durationMs` on an
   * existing `request_logs` row once the response has been sent.
   *
   * Errors are logged but never re-thrown — a failed update must not affect
   * the completed HTTP response.
   *
   * @param id - Primary key of the `request_logs` row to update.
   * @param statusCode - Final HTTP status code of the response.
   * @param durationMs - Total request duration in milliseconds.
   */
  safeUpdate(id: number, statusCode: number, durationMs: number): void {
    this.repo
      .update(
        { id } as FindOptionsWhere<RequestLog>,
        { statusCode, durationMs } as DeepPartial<RequestLog>,
      )
      .catch((err: unknown) => {
        this.logger.error(
          `request_logs update failed for id=${id}: ${(err as Error).message}`,
          ModuleName.ActivityLog,
        );
      });
  }
}
