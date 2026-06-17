import { AppConfigService } from '@/config/app';
import { CookieConfigService } from '@/config/cookie';
import { StorageConfigService } from '@/config/storage';
import { DbConfigService } from '@/config/db';
import { GoogleConfigService } from '@/config/google';
import { JwtConfigService } from '@/config/jwt';
import { MailConfigService } from '@/config/mail';
import { RabbitmqConfigService } from '@/config/rabbitmq';
import { RealtimeConfigService } from '@/config/realtime';
import { RedisConfigService } from '@/config/redis';
import { SwaggerConfigService } from '@/config/swagger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  constructor(
    public readonly app: AppConfigService,
    public readonly swagger: SwaggerConfigService,
    public readonly db: DbConfigService,
    public readonly rabbitmq: RabbitmqConfigService,
    public readonly realtime: RealtimeConfigService,
    public readonly jwt: JwtConfigService,
    public readonly google: GoogleConfigService,
    public readonly redis: RedisConfigService,
    public readonly mail: MailConfigService,
    public readonly cookie: CookieConfigService,
    public readonly storage: StorageConfigService,
  ) {}
}
