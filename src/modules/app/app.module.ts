import { ConfigModule } from '@/config';
import { CronModule } from '@/cron/cron.module';
import { DatabaseModule } from '@/db/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthGuard, PermissionsGuard } from '@/modules/auth/guards';
import { HealthModule } from '@/modules/healths/health.module';
import { PermissionModule } from '@/modules/permissions/permission.module';
import { UserModule } from '@/modules/users/user.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { SharedModule } from '@/shared';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    CronModule,
    SharedModule,
    DatabaseModule,
    HealthModule,
    RealtimeModule,
    AuthModule,
    PermissionModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
