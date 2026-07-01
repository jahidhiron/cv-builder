import { ModuleName } from '@/common/base';
import { ConfigService } from '@/config';
import { AppLogger } from '@/config/logger';
import { SystemLog } from '@/modules/activity-log/decorators';
import { Injectable } from '@nestjs/common';
import FormData from 'form-data';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import Mailgun from 'mailgun.js';
import * as path from 'path';
import type { MailProvider } from '../../interfaces/mail-provider.interface';
import type { SendMailOptions } from '../../interfaces/send-mail.interface';

/**
 * Mailgun implementation of {@link MailProvider}.
 *
 * Supports both Handlebars template-based emails and raw HTML emails.
 * Templates are resolved by scanning the application source tree for a
 * directory whose name matches the `module` option, then looking up
 * `<module>/templates/emails/<template>.hbs`.
 *
 * Both the module-path scan and compiled templates are cached in-memory for
 * the lifetime of the service instance to avoid redundant filesystem I/O.
 *
 * When `MAILGUN_API_KEY` or `MAILGUN_DOMAIN` are absent, the service logs a
 * warning and silently skips all send attempts rather than throwing at startup.
 */
@Injectable()
export class MailgunService implements MailProvider {
  private readonly mg: ReturnType<InstanceType<typeof Mailgun>['client']> | null = null;
  private readonly domain: string | undefined;
  private readonly fromEmail: string | undefined;
  private readonly fromName: string;
  private readonly templatesBaseDir: string;

  /** Cache of module-name → resolved absolute directory path (or `null` when not found). */
  private readonly modulePathCache = new Map<string, string | null>();
  /** Cache of absolute template path → compiled Handlebars delegate. */
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  /**
   * @param configService - Supplies Mailgun credentials and default from-address config.
   * @param logger - Application logger used for warnings, errors, and send confirmations.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    const mail = this.configService.mail;
    const apiKey = mail.mailgunApiKey;
    const domain = mail.mailgunDomain;

    if (!apiKey || !domain) {
      this.logger.warn(
        'MAILGUN_API_KEY or MAILGUN_DOMAIN is not configured. Email sending will be disabled.',
      );
    } else {
      const mailgun = new Mailgun(FormData);
      this.mg = mailgun.client({ username: 'api', key: apiKey });
      this.domain = domain;
    }

    this.fromEmail = mail.mailgunFromEmail;
    this.fromName = mail.mailgunFromName || 'No-Reply';

    const baseDir = process.cwd();
    const distDir = path.join(baseDir, 'dist');
    this.templatesBaseDir = fs.existsSync(distDir) ? distDir : path.join(baseDir, 'src');
  }

  /**
   * Send an email via the Mailgun API.
   *
   * When `options.template` and `options.module` are both provided, the email
   * body is rendered from a Handlebars template. Otherwise `options.html` is
   * used directly. Errors are caught and logged without re-throwing so that a
   * failed email delivery never crashes the calling request.
   *
   * @param options - Recipient, subject, and either a template reference or raw HTML.
   */
  @SystemLog(ModuleName.Shared)
  async send(options: SendMailOptions): Promise<void> {
    if (!this.mg || !this.domain) {
      this.logger.warn('Mailgun not initialised — skipping email send.');
      return;
    }
    if (!this.fromEmail) {
      this.logger.error('MAILGUN_FROM_EMAIL is not configured — cannot send email.');
      return;
    }

    try {
      const html =
        options.template && options.module
          ? this.renderTemplate(options.module, options.template, options.context ?? {})
          : options.html;

      if (!html) throw new Error('Either "html" or "template" + "module" must be provided.');

      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      const message: Record<string, unknown> = {
        from: options.from ?? `${this.fromName} <${this.fromEmail}>`,
        to: recipients,
        subject: options.subject,
        html,
        text: options.text ?? htmlToPlainText(html),
      };
      if (options.replyTo) message['h:Reply-To'] = options.replyTo;

      const result = await this.mg.messages.create(
        this.domain,
        message as Parameters<typeof this.mg.messages.create>[1],
      );
      this.logger.log(`Email sent to ${recipients.join(', ')}. Message ID: ${result.id}`);
    } catch (e) {
      this.logger.error(
        `Failed to send email to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * Compile and render a Handlebars template with the given context.
   *
   * @param moduleName   - Module folder name used to locate the template directory.
   * @param templateName - Template filename without the `.hbs` extension.
   * @param context      - Data passed to the Handlebars compiler.
   * @returns Rendered HTML string.
   */
  private renderTemplate(
    moduleName: string,
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    const templatePath = this.resolveTemplatePath(moduleName, templateName);
    return this.getCompiledTemplate(templatePath)(context);
  }

  /**
   * Resolve the absolute path to a template file.
   *
   * Uses the module-path cache to avoid repeated filesystem scans. Invalidates
   * the cached module path when the expected `.hbs` file is not found (handles
   * template files added after startup).
   *
   * @throws When the module directory or the `.hbs` file cannot be located.
   */
  private resolveTemplatePath(moduleName: string, templateName: string): string {
    if (!this.modulePathCache.has(moduleName)) {
      this.modulePathCache.set(moduleName, this.findModulePath(moduleName));
    }

    const modulePath = this.modulePathCache.get(moduleName);
    if (!modulePath) {
      throw new Error(`Module folder "${moduleName}" not found under ${this.templatesBaseDir}`);
    }

    const templatePath = path.join(modulePath, 'mail', templateName, `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      this.modulePathCache.delete(moduleName);
      throw new Error(`Template file not found: ${templatePath}`);
    }

    return templatePath;
  }

  /**
   * Return a compiled Handlebars template delegate, loading and caching it on first access.
   *
   * @param templatePath - Absolute path to the `.hbs` file.
   * @throws When the file cannot be read or compiled.
   */
  private getCompiledTemplate(templatePath: string): Handlebars.TemplateDelegate {
    if (!this.templateCache.has(templatePath)) {
      try {
        const source = fs.readFileSync(templatePath, 'utf-8');
        this.templateCache.set(templatePath, Handlebars.compile(source));
      } catch (error) {
        throw new Error(`Template compilation error: ${(error as Error).message}`);
      }
    }
    return this.templateCache.get(templatePath)!;
  }

  /**
   * Recursively search the templates base directory for a folder matching `moduleName`.
   *
   * The comparison is case-insensitive to tolerate filesystem inconsistencies.
   *
   * @param moduleName - Target directory name.
   * @returns Absolute path when found, `null` otherwise.
   */
  private findModulePath(moduleName: string): string | null {
    const search = (dir: string): string | null => {
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return null;
      }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.name.toLowerCase() === moduleName.toLowerCase()) return fullPath;
        const nested = search(fullPath);
        if (nested) return nested;
      }
      return null;
    };
    return search(this.templatesBaseDir);
  }
}

/**
 * Strip HTML tags and decode common entities to produce a plain-text fallback.
 *
 * Preserves block-level line breaks (`<br>`, `<p>`, `<div>`, etc.) and
 * collapses consecutive blank lines to a maximum of one.
 *
 * @param html - Raw HTML string to convert.
 * @returns Plain-text representation suitable for the email `text` field.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
