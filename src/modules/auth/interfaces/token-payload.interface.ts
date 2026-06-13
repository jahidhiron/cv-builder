import { TokenType } from '@/modules/auth/enums';
import { User } from '@/modules/users/entities/user.entity';

export interface TokenPayload {
  type: TokenType;
  user: User;
}
