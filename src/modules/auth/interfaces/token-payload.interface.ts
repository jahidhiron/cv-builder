import { TokenType } from '@/modules/auth/enums';
import { User } from '@/modules/users/entities/user.entity';

/**
 * Intermediate payload passed to `CreateTokenProvider` when generating
 * both access and refresh JWTs for a user after successful authentication.
 */
export interface TokenPayload {
  type: TokenType;
  user: User;
}
