import { AppLogger } from '@/config/logger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Validates the database connection on application startup.
 *
 * Runs a lightweight `SELECT 1` query in `onModuleInit` to confirm that the
 * TypeORM `DataSource` is reachable. If the query fails the process exits
 * immediately so infrastructure-level issues are surfaced before the app
 * accepts traffic.
 */
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
