import { TokenType } from '@/modules/auth/enums';

/**
 * Payload emitted from `VerifyTokenProvider` after a valid one-time token is consumed.
 * Used by `VerifyEmailProvider` and `ResetPasswordProvider` to identify the requesting user.
 */
export interface VerificationTokenPayload {
  type: TokenType;
  email: string;
  token: string;
}
