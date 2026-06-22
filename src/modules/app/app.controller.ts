import { ModuleName } from '@/common/base/enums';
import { Auth } from '@/modules/auth/decorators';
import { AuthType } from '@/modules/auth/enums';
import { AppStatusSwaggerDocs } from '@/modules/app/swaggers';
import { SuccessResponse } from '@/shared/response';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Auth(AuthType.None)
@ApiTags('App')
@Controller('app')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly successResponse: SuccessResponse,
  ) {}

  @Get('status')
  @AppStatusSwaggerDocs()
  appStatus() {
    const result = this.appService.appStatus();
    return this.successResponse.ok({ module: ModuleName.App, key: 'app-status', ...result });
  }
}
