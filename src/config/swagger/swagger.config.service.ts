import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SwaggerConfigService {
  constructor(private configService: ConfigService) {}

  get user(): string {
    return this.configService.get<string>('swagger.user') as string;
  }

  get password(): string {
    return this.configService.get<string>('swagger.password') as string;
  }

  get enableSwaggerProtection(): boolean {
    return this.configService.get<string>('swagger.enableSwaggerProtection') === 'true';
  }
}
