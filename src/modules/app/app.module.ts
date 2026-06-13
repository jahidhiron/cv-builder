import { CronModule } from '@/cron/cron.module';
import { DatabaseModule } from '@/db/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthGuard } from '@/modules/auth/guards';
import { HealthModule } from '@/modules/healths/health.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { SharedModule } from '@/shared';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@/config';
import { APP_GUARD } from '@nestjs/core';
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
