import { Injectable } from '@nestjs/common';
import { ServerErrorListQueryDto, UpdateServerErrorStatusDto } from './dtos';
import {
  DeleteServerErrorProvider,
  FindOneServerErrorProvider,
  ListServerErrorsProvider,
  TrackErrorProvider,
  UpdateErrorTrackingProvider,
} from './providers';
import type { RequestContext } from './providers/interfaces';

/**
 * Facade service for the error-tracking domain.
 *
 * Exposes two distinct concerns through a single entry point:
 *
 * - **Passive tracking** — {@link track} is called fire-and-forget by
 *   {@link GlobalExceptionFilter} on every 500-level response.
 * - **Admin management** — {@link list}, {@link findOne}, {@link updateStatus},
 *   and {@link remove} back the administrator controller endpoints.
 *
 * All business logic lives in the individual providers; this class only
 * wires them together.
 */
@Injectable()
export class ErrorTrackingService {
  constructor(
    private readonly trackErrorProvider: TrackErrorProvider,
    private readonly findOneServerErrorProvider: FindOneServerErrorProvider,
    private readonly listServerErrorsProvider: ListServerErrorsProvider,
    private readonly updateErrorTrackingProvider: UpdateErrorTrackingProvider,
    private readonly deleteServerErrorProvider: DeleteServerErrorProvider,
  ) {}

  /**
   * Persist a 500-level error and dispatch a first-occurrence alert in production.
   * Swallows all internal errors — tracking must never affect the HTTP response.
   */
  track({ exception, request }: { exception: unknown; request: RequestContext }): Promise<void> {
    return this.trackErrorProvider.execute(exception, request);
  }

  /** Return a paginated list of tracked server errors, optionally filtered by status. */
  list(dto: ServerErrorListQueryDto) {
    return this.listServerErrorsProvider.execute(dto);
  }

  /** Retrieve a single server-error record by ID. Throws 404 when not found. */
  findOne(id: number) {
    return this.findOneServerErrorProvider.execute({ id });
  }

  /** Update the lifecycle status of a server-error record. Throws 404 when not found. */
  updateStatus(id: number, dto: UpdateServerErrorStatusDto) {
    return this.updateErrorTrackingProvider.execute({ id }, { status: dto.status });
  }

  /** Permanently delete a server-error record. Throws 404 when not found. */
  remove(id: number, currentUserId: number) {
    return this.deleteServerErrorProvider.execute({ id }, currentUserId, true);
  }
}
