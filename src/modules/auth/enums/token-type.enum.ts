/**
 * Discriminator stored in the `verification_tokens.type` column.
 * Prevents cross-flow token reuse (e.g. an email-verification token cannot be
 * used to reset a password, even if both are valid at the same time).
 */
export enum TokenType {
  VerifyEmail = 'verify-email',
  ForgotPassword = 'forgot-password',
}
