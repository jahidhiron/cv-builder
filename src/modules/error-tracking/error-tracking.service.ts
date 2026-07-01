import type { FindOneOptions } from '@/common/base';
import type { UserPayload } from '@/modules/auth/interfaces';
import { Injectable } from '@nestjs/common';
import type { FindOptionsWhere } from 'typeorm';
import { ServerErrorListQueryDto, UpdateServerErrorStatusDto } from './dtos';
import { ServerError } from './entities/server-error.entity';
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
  /**
   * @param trackErrorProvider - Provider that persists a 500-level error and dispatches alerts.
   * @param findOneServerErrorProvider - Provider for looking up a single server-error record.
   * @param listServerErrorsProvider - Provider for paginated server-error listings.
   * @param updateErrorTrackingProvider - Provider for updating a server-error record.
   * @param deleteServerErrorProvider - Provider for permanently deleting a server-error record.
   */
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
   *
   * @param params - The caught exception and the request context it occurred in.
   * @returns Resolves once tracking completes; never rejects.
   */
  track({ exception, request }: { exception: unknown; request: RequestContext }): Promise<void> {
    return this.trackErrorProvider.execute(exception, request);
  }

  /**
   * Returns a paginated list of tracked server errors, optionally filtered by status.
   *
   * @param dto - Query DTO containing pagination, sorting, and optional status filter.
   * @returns A paginated list response.
   */
  list(dto: ServerErrorListQueryDto) {
    return this.listServerErrorsProvider.execute(dto);
  }

  /**
   * @param where   - TypeORM filter conditions identifying the server-error record.
   * @param options - Optional query options; set `throwError: false` to return
   *                  `{ serverError: null }` instead of throwing when no match is found.
   * @returns `{ serverError }` — the matched record, or `{ serverError: null }` when
   *          `throwError` is `false`.
   * @throws {NotFoundException} When no match is found and `throwError` is not `false`.
   */
  async findOne<TThrow extends boolean = true>(
    where: FindOptionsWhere<ServerError>,
    options?: FindOneOptions<ServerError, TThrow>,
  ): Promise<TThrow extends false ? { serverError: ServerError | null } : { serverError: ServerError }> {
    const serverError =
      options?.throwError === false
        ? await this.findOneServerErrorProvider.execute(where, { throwError: false })
        : await this.findOneServerErrorProvider.execute(where);
    return { serverError } as never;
  }

  /**
   * @param where - Conditions identifying the server-error record to update.
   * @param dto   - Validated status-transition payload.
   * @returns `{ serverError }` containing the updated {@link ServerError} entity.
   * @throws {NotFoundException} When no record matches `where`.
   */
  async updateStatus(where: FindOptionsWhere<ServerError>, dto: UpdateServerErrorStatusDto) {
    const serverError = await this.updateErrorTrackingProvider.execute(where, { status: dto.status });
    return { serverError };
  }

  /**
   * @param where       - Conditions identifying the server-error record to delete.
   * @param currentUser - JWT-extracted payload of the actor performing the deletion.
   * @throws {NotFoundException} When no record matches `where`.
   */
  remove(where: FindOptionsWhere<ServerError>, currentUser: UserPayload) {
    return this.deleteServerErrorProvider.execute(where, currentUser.id, true);
  }
}
