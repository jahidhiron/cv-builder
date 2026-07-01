import { ModuleName } from '@/common/base/enums';
import { ConfigService } from '@/config';
import { SystemLog } from '@/modules/activity-log/decorators';
import { buildServerErrorAlertEmail } from '@/modules/error-tracking/mail';
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
  /**
   * @param upsertProvider - Provider that upserts the error fingerprint and returns its occurrence count.
   * @param updateProvider - Provider used to stamp `emailSentAt` once the alert email is sent.
   * @param mailService    - Shared mail service used to dispatch the alert email.
   * @param configService  - Config service consulted for the production flag and mail/app settings.
   */
  constructor(
    private readonly upsertProvider: UpsertServerErrorProvider,
    private readonly updateProvider: UpdateErrorTrackingProvider,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Persists the caught exception as a server-error record and, on its first
   * occurrence in production, dispatches an admin alert email.
   *
   * @param exception - The caught exception (or non-`Error` thrown value).
   * @param request   - Request context (`method`, `url`) the exception occurred in.
   * @returns Resolves once tracking completes; never rejects — all internal
   *          errors are swallowed so tracking can never affect the HTTP response.
   */
  @SystemLog(ModuleName.ErrorTracking)
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

  /**
   * Derives a stable SHA-256 fingerprint from the error class, message, and top stack frame.
   *
   * @param errorName - Constructor name of the thrown error.
   * @param message   - Error message.
   * @param stack     - Stack trace, or `null` when unavailable.
   * @returns A 64-character hex digest used to deduplicate repeated occurrences.
   */
  private buildFingerprint(errorName: string, message: string, stack: string | null): string {
    const topFrame = stack?.split('\n')[1]?.trim() ?? '';
    return createHash('sha256')
      .update(`${errorName}:${message}\n${topFrame}`)
      .digest('hex')
      .slice(0, 64);
  }

  /**
   * Sends the first-occurrence admin alert email. No-ops when no support
   * inbox is configured.
   *
   * @param errorName  - Constructor name of the thrown error.
   * @param message    - Error message.
   * @param stack      - Stack trace, or `null` when unavailable.
   * @param request    - Request context (`method`, `url`) the exception occurred in.
   * @param occurredAt - Timestamp of the first occurrence.
   */
  private async sendAdminAlert(
    errorName: string,
    message: string,
    stack: string | null,
    request: RequestContext,
    occurredAt: Date,
  ): Promise<void> {
    const { app, mail } = this.configService;
    if (!mail.supportEmail) return;

    await this.mailService.sendEmail(
      buildServerErrorAlertEmail(
        { errorName, message, method: request.method, path: request.url, stack, occurredAt },
        { companyName: app.companyName, supportEmail: mail.supportEmail, logoUrl: mail.logoUrl },
      ),
    );
  }
}
