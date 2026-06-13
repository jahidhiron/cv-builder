import { ConfigService } from '@/config';
import { Inject, Injectable } from '@nestjs/common';
import { MAIL_PROVIDER } from './mail.constant';
import type { SendEmailParams, SendMailOptions } from './interfaces/send-mail.interface';

/**
 * Application-level mail service consumed by feature modules.
 *
 * Delegates to the {@link MAIL_PROVIDER} transport (currently Mailgun) and
 * automatically injects common template variables — `companyName`, `supportEmail`,
 * and `year` — so templates do not need to pass them explicitly.
 *
 * All send operations are no-ops in the `testing` environment, preventing
 * accidental email delivery during test runs.
 */
@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: { send(options: SendMailOptions): Promise<void> },
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send a template-based transactional email.
   *
   * Merges `companyName`, `supportEmail`, and `year` into the template context
   * before delegating to the active mail provider.
   *
   * @param params - Recipient, subject, template path, and optional custom context.
   */
  async sendEmail(params: SendEmailParams): Promise<void> {
    if (this.configService.app.env === 'testing') return;

    const options: SendMailOptions = {
      ...params,
      context: {
        ...(params.context ?? {}),
        companyName: this.configService.app.companyName,
        supportEmail: this.configService.mail.supportEmail,
        year: new Date().getFullYear(),
      },
    };

    await this.provider.send(options);
  }

  /**
   * Send a raw HTML email without a Handlebars template.
   *
   * Useful for dynamic content that cannot be pre-compiled into a template
   * (e.g. user-generated previews, webhook-triggered notifications).
   *
   * @param params - Recipient, subject, and raw HTML body. Plain-text is auto-derived when omitted.
   */
  async sendRaw(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
  }): Promise<void> {
    if (this.configService.app.env === 'testing') return;
    await this.provider.send(params);
  }
}
