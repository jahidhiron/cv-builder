import { ConfigModule } from '@/config';
import { Module } from '@nestjs/common';
import { MailgunService } from './mailgun.service';

/**
 * Encapsulates the Mailgun transport implementation.
 *
 * Provides and exports {@link MailgunService} so that {@link MailModule} can
 * bind it to the {@link MAIL_PROVIDER} injection token via `useExisting`.
 * This module is an internal detail of the mail subsystem and should not be
 * imported directly by feature modules.
 */
@Module({
  imports: [ConfigModule],
  providers: [MailgunService],
  exports: [MailgunService],
})
export class MailgunModule {}
