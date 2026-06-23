import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { MailService } from '@/shared/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { UpdateErrorTrackingProvider } from './update-error-tracking.provider';
import { UpsertServerErrorProvider } from './upsert-server-error.provider';
import type { RequestContext } from './interfaces';

/**
 * Orchestrates 500-error tracking: persists the error fingerprint, counts
 * repeated occurrences, and — on the very first occurrence in production —
 * dispatches an alert email to the support inbox.
 *
 * All operations are swallowed internally so a tracker failure can never
 * interfere with the HTTP response.
 */
@Injectable()
export class TrackErrorProvider {
  constructor(
    private readonly upsertProvider: UpsertServerErrorProvider,
    private readonly updateProvider: UpdateErrorTrackingProvider,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(exception: unknown, request: RequestContext): Promise<void> {
    try {
      const errorName = exception instanceof Error ? exception.constructor.name : 'UnknownError';
      const message = exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? (exception.stack ?? null) : null;

      const fingerprint = this.buildFingerprint(errorName, message, stack);
      const now = new Date();

      const occurrenceCount = await this.upsertProvider.execute({
        fingerprint,
        errorName,
        message,
        method: request.method,
        path: request.url,
        stack,
        now,
      });

      if (occurrenceCount === 1 && this.configService.app.isProd) {
        await this.sendAdminAlert(errorName, message, stack, request, now);
        await this.updateProvider.execute({ fingerprint }, { emailSentAt: now });
      }
    } catch {
      // Swallow — tracking must never affect the HTTP response cycle.
    }
  }

  /** Strips control characters and collapses whitespace so the string is safe for an email subject line. */
  private sanitizeSubject(text: string): string {
    return text
      .replace(/\p{Cc}/gu, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private buildFingerprint(errorName: string, message: string, stack: string | null): string {
    const topFrame = stack?.split('\n')[1]?.trim() ?? '';
    return createHash('sha256')
      .update(`${errorName}:${message}\n${topFrame}`)
      .digest('hex')
      .slice(0, 64);
  }

  private async sendAdminAlert(
    errorName: string,
    message: string,
    stack: string | null,
    request: RequestContext,
    occurredAt: Date,
  ): Promise<void> {
    const { app, mail } = this.configService;
    if (!mail.supportEmail) return;

    await this.mailService.sendEmail({
      module: ModuleName.ErrorTracking,
      template: 'server-error-alert',
      to: mail.supportEmail,
      subject: `[${app.companyName} Server Error] ${this.sanitizeSubject(errorName)}: ${this.sanitizeSubject(message).slice(0, 80)}`,
      context: {
        errorName,
        message,
        method: request.method,
        path: request.url,
        occurredAt: occurredAt.toISOString(),
        stack: stack ?? null,
        logoUrl: mail.logoUrl,
        supportEmail: mail.supportEmail,
      },
    });
  }
}
