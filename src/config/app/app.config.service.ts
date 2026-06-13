import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get env(): string {
    return this.configService.get<string>('app.env')!;
  }

  get isDev(): boolean {
    return this.configService.get<boolean>('app.isDev')!;
  }

  get isStaging(): boolean {
    return this.configService.get<boolean>('app.isStaging')!;
  }

  get isProd(): boolean {
    return this.configService.get<boolean>('app.isProd')!;
  }

  get isTest(): boolean {
    return this.configService.get<boolean>('app.isTest')!;
  }

  get port(): number {
    return this.configService.get<number>('app.port')!;
  }

  get apiBaseUrl(): string {
    return this.configService.get<string>('app.apiBaseUrl')!;
  }

  get clientBaseUrl(): string {
    return this.configService.get<string>('app.clientBaseUrl')!;
  }

  get companyName(): string {
    return this.configService.get<string>('app.companyName')!;
  }
}
