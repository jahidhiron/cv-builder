import type { SendMailOptions } from './send-mail.interface';

/**
 * Contract that every mail-transport implementation must satisfy.
 *
 * Register a concrete class against the {@link MAIL_PROVIDER} injection token
 * in {@link MailModule} to make it the active provider. Consumers always depend
 * on this interface, never on a concrete class.
 *
 * @Injectable()
 * export class SendGridService implements MailProvider {
 *   async send(options: SendMailOptions): Promise<void> { ... }
 * }
 * ```
 */
export interface MailProvider {
  /**
   * Deliver an email using this transport.
   *
   * @param options - Recipient, subject, and either a Handlebars template path or raw HTML.
   * @throws When the underlying transport rejects the request (network error, invalid API key, etc.).
   */
  send(options: SendMailOptions): Promise<void>;
}
