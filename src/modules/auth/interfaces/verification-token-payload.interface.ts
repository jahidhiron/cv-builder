import { TokenType } from '@/modules/auth/enums';

export interface VerificationTokenPayload {
  type: TokenType;
  email: string;
  token: string;
}
