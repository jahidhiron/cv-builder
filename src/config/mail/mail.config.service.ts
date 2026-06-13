import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailConfigService {
  constructor(private configService: ConfigService) {}

  get mailgunApiKey(): string {
    return this.configService.get<string>('mailgunApiKey') as string;
  }

  get mailgunDomain(): string {
    return this.configService.get<string>('mailgunDomain') as string;
  }

  get mailgunFromEmail(): string {
    return this.configService.get<string>('mailgunFromEmail') as string;
  }

  get mailgunFromName(): string {
    return this.configService.get<string>('mailgunFromName') as string;
  }

  get supportEmail(): string {
    return this.configService.get<string>('supportEmail') as string;
  }

  get logoUrl(): string {
    return this.configService.get<string>('logoUrl') as string;
  }
}
