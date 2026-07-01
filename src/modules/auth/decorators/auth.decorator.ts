import { AUTH_TYPE_KEY } from '@/modules/auth/constants';
import { AuthType } from '@/modules/auth/enums';
import { SetMetadata } from '@nestjs/common';

/**
 * Sets the allowed authentication types for a route or controller.
 *
 */
export const Auth = (...authTypes: AuthType[]) => SetMetadata(AUTH_TYPE_KEY, authTypes);
