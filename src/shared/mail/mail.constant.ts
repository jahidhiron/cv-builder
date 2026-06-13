/**
 * NestJS injection token for the active {@link MailProvider} implementation.
 *
 * Use `@Inject(MAIL_PROVIDER)` to receive the currently registered provider
 * (e.g. Mailgun) without coupling to a concrete class.
 */
export const MAIL_PROVIDER = 'MAIL_PROVIDER' as const;
