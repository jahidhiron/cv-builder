import { AUTH_TYPE_KEY } from '@/modules/auth/constants/auth.constant';
import { AuthType } from '@/modules/auth/enums';
import { SetMetadata } from '@nestjs/common';

export const Auth = (...authTypes: AuthType[]) => SetMetadata(AUTH_TYPE_KEY, authTypes);
