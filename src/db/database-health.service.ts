import { AppLogger } from '@/config/logger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connection successfully initialized', 'Database');
    } catch (err) {
      this.logger.error('Database connection failed', (err as Error).stack, 'Database');
      process.exit(1);
    }
  }
}
