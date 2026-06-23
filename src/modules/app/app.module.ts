import { GlobalExceptionFilter } from '@/common/filters';
import { HttpLoggingInterceptor } from '@/common/interceptors';
import { ConfigModule } from '@/config';
import { InfrastructureModule } from '@/infrastructure';
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
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class AppModule {}
