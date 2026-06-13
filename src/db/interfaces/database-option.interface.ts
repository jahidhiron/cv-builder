import { AppConfigService } from '@/config/app';
import { DbConfigService } from '@/config/db';
import { AppLogger } from '@/config/logger';

export interface DatabaseOptions {
  config: {
    app: AppConfigService;
    db: DbConfigService;
  };
  logger: AppLogger;
}
