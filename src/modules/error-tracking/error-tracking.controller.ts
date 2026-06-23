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
  constructor(
    private readonly errorTrackingService: ErrorTrackingService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /** Paginated list of server errors. Supports search, status filter, and sorting. */
  @Serialize(ServerErrorListResponseDto)
  @Get()
  async list(@Query() query: ServerErrorListQueryDto) {
    const result = await this.errorTrackingService.list(query);
    return this.successResponse.ok({ module: ModuleName.ErrorTracking, key: 'server-errors-list', ...result });
  }

  /** Retrieve the full detail of a single server-error record by ID. */
  @Serialize(ServerErrorResponseDto)
  @Get(':id')
  async findOne(@Param('id', ParseIdPipe) id: number) {
    const serverError = await this.errorTrackingService.findOne(id);
    return this.successResponse.ok({ module: ModuleName.ErrorTracking, key: 'server-error-detail', ...serverError });
  }

  /** Transition a server-error record to a new lifecycle status. */
  @Serialize(ServerErrorResponseDto)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateServerErrorStatusDto,
  ) {
    const serverError = await this.errorTrackingService.updateStatus(id, dto);
    return this.successResponse.ok({ module: ModuleName.ErrorTracking, key: 'update-server-error-status', ...serverError });
  }

  /** Permanently delete a server-error record. This action cannot be undone. */
  @Delete(':id')
  async remove(
    @Param('id', ParseIdPipe) id: number,
    @CurrentUser() currentUser: UserPayload,
  ) {
    await this.errorTrackingService.remove(id, currentUser.id);
    return this.successResponse.ok({ module: ModuleName.ErrorTracking, key: 'delete-server-error' });
  }
}
