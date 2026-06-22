import { AUTH_TYPE_KEY } from '@/modules/auth/constants/auth.constant';
import { AuthType } from '@/modules/auth/enums';
import { SetMetadata } from '@nestjs/common';

/**
 * Sets the allowed authentication types for a route or controller.
 *
 * @example
 * ```ts
 * \@Auth(AuthType.None)   // public — no token required
 * \@Auth(AuthType.Optional) // attaches user if token present but never blocks
 * \@Get('me')
 * ```
 */
export const Auth = (...authTypes: AuthType[]) => SetMetadata(AUTH_TYPE_KEY, authTypes);
