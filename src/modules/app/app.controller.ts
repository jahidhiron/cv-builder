import { ModuleName } from '@/common/base/enums';
import { Auth } from '@/modules/auth/decorators';
import { AuthType } from '@/modules/auth/enums';
import { AppStatusSwaggerDocs } from '@/modules/app/swaggers';
import { SuccessResponse } from '@/shared/response';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Controller for general application endpoints.
 *
 * @module App
 */
@Auth(AuthType.None)
@ApiTags('App')
@Controller('app')
export class AppController {
  /**
   * @param appService - Service providing application-level operations.
   * @param successResponse - Utility for building standardised success responses.
   */
  constructor(
    private readonly appService: AppService,
    private readonly successResponse: SuccessResponse,
  ) {}

  /**
   * Returns the current health/status of the application.
   *
   * @returns A standardised success response containing app status information.
   */
  @Get('status')
  @AppStatusSwaggerDocs()
  appStatus() {
    const result = this.appService.appStatus();
    return this.successResponse.ok({ module: ModuleName.App, key: 'app-status', ...result });
  }
}
