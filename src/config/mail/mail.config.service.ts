import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `mail.*` namespace registered by `mail.config.ts`.
 *
 * Provides Mailgun credentials and sender details consumed by the mail provider
 * and injected into email templates as `companyName`, `supportEmail`, and `logoUrl`.
 */
@Injectable()
export class MailConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** Mailgun private API key (`MAILGUN_API_KEY`). */
  get mailgunApiKey(): string {
    return this.configService.get<string>('mail.apiKey')!;
  }

  /** Mailgun sending domain (e.g. `mg.example.com`) (`MAILGUN_DOMAIN`). */
  get mailgunDomain(): string {
    return this.configService.get<string>('mail.domain')!;
  }

  /** From email address shown in the `From` header (`MAILGUN_FROM_EMAIL`). */
  get mailgunFromEmail(): string {
    return this.configService.get<string>('mail.fromEmail')!;
  }

  /** Display name in the `From` header (`MAILGUN_FROM_NAME`). */
  get mailgunFromName(): string {
    return this.configService.get<string>('mail.fromName')!;
  }

  /** Support email address injected into email templates (`SUPPORT_EMAIL`). */
  get supportEmail(): string {
    return this.configService.get<string>('mail.supportEmail')!;
  }

  /** Public URL of the company logo used in email templates. */
  get logoUrl(): string {
    return this.configService.get<string>('mail.logoUrl')!;
  }
}
