import { AppLogger } from '@/config/logger';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExampleCronService {
  constructor(private readonly logger: AppLogger) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleExampleTask(): Promise<void> {
    this.logger.log('Example cron job running');
  }
}
