import { UserPayload } from '@/modules/auth/interfaces';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 *
 * Must be used on routes protected by `AuthGuard` (or any guard that sets `request.user`).
 *
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    return request.user!;
  },
);
