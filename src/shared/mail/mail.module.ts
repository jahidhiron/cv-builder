import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { MAIL_PROVIDER } from './constants';
import { MailService } from './mail.service';
import { MailgunModule } from './providers/mailgun/mailgun.module';
import { MailgunService } from './providers/mailgun/mailgun.service';

/**
 * Application-level mail module.
 *
 * Wires the active transport (Mailgun) to the {@link MAIL_PROVIDER} token so
 * that {@link MailService} and all callers remain decoupled from the concrete
 * provider. To switch transports, replace `useExisting: MailgunService` with
 * any class that implements {@link MailProvider} — no consumer code changes.
 */
@Module({
  imports: [ConfigModule, MailgunModule],
  providers: [
    MailService,
    { provide: MAIL_PROVIDER, useExisting: MailgunService },
  ],
  exports: [MailService],
})
export class MailModule {}
