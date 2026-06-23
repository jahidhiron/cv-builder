import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { ErrorTrackingController } from './error-tracking.controller';
import { ErrorTrackingService } from './error-tracking.service';
import { ServerErrorRepository } from './repositories/server-error.repository';
import {
  DeleteServerErrorProvider,
  FindOneServerErrorProvider,
  ListServerErrorsProvider,
  TrackErrorProvider,
  UpdateErrorTrackingProvider,
  UpsertServerErrorProvider,
} from './providers';

/**
 * NestJS module for the server-error tracking feature.
 *
 * Registers all providers, the admin controller, and the facade service.
 * Only {@link ErrorTrackingService} is exported — consumers (e.g. `AppModule`
 * via `APP_FILTER`) should inject the service, not individual providers.
 */
@Module({
  imports: [ConfigModule],
  controllers: [ErrorTrackingController],
  providers: [
    ServerErrorRepository,
    UpsertServerErrorProvider,
    UpdateErrorTrackingProvider,
    TrackErrorProvider,
    FindOneServerErrorProvider,
    ListServerErrorsProvider,
    DeleteServerErrorProvider,
    ErrorTrackingService,
  ],
  exports: [ErrorTrackingService],
})
export class ErrorTrackingModule {}
