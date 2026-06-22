import { UserPayload } from '@/modules/auth/interfaces';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that restricts access to users with the `admin` role key.
 *
 * Checks `request.user.roleKey` — the role key is embedded in the JWT payload
 * during sign-in and refreshed on each token rotation.
 *
 * @throws {ForbiddenException} When the authenticated user is not an admin.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    if (request.user?.roleKey !== 'admin') {
      throw new ForbiddenException('Permission denied');
    }
    return true;
  }
}
