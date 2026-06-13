import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbConfigService {
  constructor(private configService: ConfigService) {}

  get type(): 'postgres' {
    return this.configService.get<'postgres'>('db.type')!;
  }

  get url(): string | undefined {
    return this.configService.get<string>('db.url');
  }

  get host(): string {
    return this.configService.get<string>('db.host')!;
  }

  get port(): number {
    return this.configService.get<number>('db.port')!;
  }

  get username(): string {
    return this.configService.get<string>('db.username')!;
  }

  get password(): string {
    return this.configService.get<string>('db.password')!;
  }

  get database(): string {
    return this.configService.get<string>('db.database')!;
  }

  get migrationsRun(): boolean {
    return this.configService.get<boolean>('db.migrationsRun')!;
  }

  get retryAttempts(): number {
    return this.configService.get<number>('db.retryAttempts')!;
  }

  get retryDelay(): number {
    return this.configService.get<number>('db.retryDelay')!;
  }
}
