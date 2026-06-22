import { AUTH_TYPE_KEY } from '@/modules/auth/constants/auth.constant';
import { AuthType } from '@/modules/auth/enums';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Abstract base guard that handles the `AuthType` meta-data routing logic.
 *
 * Reads the `AUTH_TYPE_KEY` metadata from the handler and class:
 * - `AuthType.None` — allows the request through unconditionally (public routes).
 * - `AuthType.Optional` — delegates to `handleOptional`; attaches the user if a token
 *   is present but never blocks the request when one is absent.
 * - Any other type (default: `AuthType.Bearer`) — delegates to `validateRequest`.
 *
 * Concrete guards extend this class and implement `validateRequest`.
 * They may also override `handleOptional` if optional-auth behaviour differs.
 */
@Injectable()
export abstract class BaseAuthGuard implements CanActivate {
  constructor(protected readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (authTypes?.includes(AuthType.None)) return true;

    if (authTypes?.includes(AuthType.Optional)) {
      return this.handleOptional(context);
    }

    try {
      return await this.validateRequest(context);
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  protected async handleOptional(_context: ExecutionContext): Promise<boolean> {
    return true;
  }

  protected abstract validateRequest(context: ExecutionContext): Promise<boolean>;

  protected handleAuthError(error: unknown): never {
    if (error instanceof ForbiddenException) throw new ForbiddenException('Forbidden');
    throw new UnauthorizedException('Unauthorized');
  }
}
