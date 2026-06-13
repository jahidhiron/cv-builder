import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisConfigService {
  constructor(private configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('redisHost') as string;
  }

  get port(): number {
    return this.configService.get<number>('redisPort') as number;
  }

  get password(): string {
    return this.configService.get<string>('redisPassword') as string;
  }
}
