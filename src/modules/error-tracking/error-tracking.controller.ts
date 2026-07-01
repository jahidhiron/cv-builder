import { ModuleName } from '@/common/base/enums';
import { Serialize } from '@/common/interceptors';
import { ParseIdPipe } from '@/common/pipes';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { UserPayload } from '@/modules/auth/interfaces';
import {
  ServerErrorListQueryDto,
  ServerErrorListResponseDto,
  ServerErrorResponseDto,
  UpdateServerErrorStatusDto,
} from '@/modules/error-tracking/dtos';
import { ErrorTrackingService } from '@/modules/error-tracking/error-tracking.service';
import {
  DeleteServerErrorSwaggerDocs,
  FindOneServerErrorSwaggerDocs,
  ListServerErrorsSwaggerDocs,
  UpdateServerErrorStatusSwaggerDocs,
} from '@/modules/error-tracking/swaggers';
import { SuccessResponse } from '@/shared/response';
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * Administrator controller for managing tracked 500-level server errors.
 *
 * All endpoints require a valid bearer token. Intended for super-admin use —
 * access should be gated by role/permission guards at the infrastructure level.
 *
 * Routes:
 * - `GET    /error-tracking`          — paginated list with optional status filter
 * - `GET    /error-tracking/:id`      — single record detail
 * - `PATCH  /error-tracking/:id/status` — update lifecycle status
 * - `DELETE /error-tracking/:id`      — permanently remove a record
 */
@ApiTags('Error Tracking')
@ApiBearerAuth()
@Controller(ModuleName.ErrorTracking)
export class ErrorTrackingController {
  /**
   * @param errorTrackingService - Facade service for the error-tracking domain.
   * @param successResponse - Request-scoped helper for building 2xx response envelopes.
   */
  constructor(
    private readonly errorTrackingService: ErrorTrackingService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Returns a paginated list of tracked server errors. Super-admin only.
   *
   * @param query - Validated query parameters (page, limit, search, status, sort).
   * @returns Paginated server-error list serialized as `ServerErrorListResponseDto`.
   */
  @Serialize(ServerErrorListResponseDto)
  @Get()
  @ListServerErrorsSwaggerDocs()
  async list(@Query() query: ServerErrorListQueryDto) {
    const result = await this.errorTrackingService.list(query);
    return this.successResponse.ok({
      module: ModuleName.ErrorTracking,
      key: 'server-errors-list',
      ...result,
    });
  }

  /**
   * Returns the full detail of a single server-error record by ID. Super-admin only.
   *
   * @param id - Server-error ID parsed and validated by `ParseIdPipe`.
   * @returns The matched server-error record serialized as `ServerErrorResponseDto`.
   * @throws {NotFoundException} When no server-error record with `id` exists.
   */
  @Serialize(ServerErrorResponseDto)
  @Get(':id')
  @FindOneServerErrorSwaggerDocs()
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const result = await this.errorTrackingService.findOne({ id });
    return this.successResponse.ok({
      module: ModuleName.ErrorTracking,
      key: 'server-error-detail',
      ...result,
    });
  }

  /**
   * Transitions a server-error record to a new lifecycle status. Super-admin only.
   *
   * @param id  - Server-error ID parsed and validated by `ParseIdPipe`.
   * @param dto - Validated status-transition payload.
   * @returns The updated server-error record serialized as `ServerErrorResponseDto`.
   * @throws {NotFoundException} When no server-error record with `id` exists.
   */
  @Serialize(ServerErrorResponseDto)
  @Patch(':id/status')
  @UpdateServerErrorStatusSwaggerDocs()
  async updateStatus(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateServerErrorStatusDto) {
    const result = await this.errorTrackingService.updateStatus({ id }, dto);
    return this.successResponse.ok({
      module: ModuleName.ErrorTracking,
      key: 'update-server-error-status',
      ...result,
    });
  }

  /**
   * Permanently deletes a server-error record by ID. Super-admin only.
   * This action cannot be undone.
   *
   * @param id          - Server-error ID parsed and validated by `ParseIdPipe`.
   * @param currentUser - JWT-extracted payload of the actor performing the deletion.
   * @returns 200 OK success response.
   * @throws {NotFoundException} When no server-error record with `id` exists.
   */
  @Delete(':id')
  @DeleteServerErrorSwaggerDocs()
  async remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() currentUser: UserPayload) {
    await this.errorTrackingService.remove({ id }, currentUser);
    return this.successResponse.ok({
      module: ModuleName.ErrorTracking,
      key: 'delete-server-error',
    });
  }
}
