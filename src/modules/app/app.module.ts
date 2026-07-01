import { GlobalExceptionFilter } from '@/common/filters';
import { HttpLoggingInterceptor } from '@/common/interceptors';
import { ConfigModule } from '@/config';
import { InfrastructureModule } from '@/infrastructure';
import { ActivityLogModule } from '@/modules/activity-log/activity-log.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthGuard, PermissionsGuard } from '@/modules/auth/guards';
import { ErrorTrackingModule } from '@/modules/error-tracking/error-tracking.module';
import { HealthModule } from '@/modules/healths/health.module';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { UserModule } from '@/modules/users/user.module';
import { SharedModule } from '@/shared';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Root application module that wires together all feature modules,
 * global guards, filters, and interceptors for the NestJS application.
 *
 * Global providers registered here:
 * - {@link GlobalExceptionFilter} — catches and formats all unhandled exceptions.
 * - {@link AuthGuard} — enforces authentication on every route by default.
 * - {@link PermissionsGuard} — enforces RBAC permissions after authentication.
 * - {@link HttpLoggingInterceptor} — logs HTTP request/response metadata.
 *
 * @module App
 */
@Module({
  imports: [
    ConfigModule,
    SharedModule,
    InfrastructureModule,
    HealthModule,
    AuthModule,
    PermissionModule,
    UserModule,
    ErrorTrackingModule,
    ActivityLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // RequestLogInterceptor is NOT registered here — it lives in
    // ActivityLogModule's providers array as APP_INTERCEPTOR so its
    // constructor dependencies (LogRequestProvider, AppLogger) resolve
    // against that module's DI graph rather than AppModule's.
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule {}
