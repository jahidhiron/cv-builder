import { AUTH_TYPE_KEY } from '@/modules/auth/constants/auth.constant';
import { AuthType } from '@/modules/auth/enums';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BaseAuthGuard } from './base-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Composite authentication guard used as the global default.
 *
 * Reads the `AUTH_TYPE_KEY` metadata from the route handler:
 * - `AuthType.None` / `AuthType.Optional` — handled by {@link BaseAuthGuard}.
 * - `AuthType.Bearer` (default) — resolves a request-scoped `JwtAuthGuard`
 *   via `ModuleRef` and delegates token validation to it.
 *
 * The guard is applied globally in the module setup, so all routes are protected
 * by default; use `@Auth(AuthType.None)` to mark public endpoints.
 */
@Injectable()
export class AuthGuard extends BaseAuthGuard {
  private static readonly defaultAuthTypes = [AuthType.Bearer];

  constructor(
    private readonly moduleRef: ModuleRef,
    protected override readonly reflector: Reflector,
  ) {
    super(reflector);
  }

  protected override async handleOptional(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;
    const cookieToken = request.cookies?.accessToken as string | undefined;

    if (auth?.startsWith('Bearer ') || cookieToken) {
      const contextId = ContextIdFactory.getByRequest(request);
      const jwtGuard = await this.moduleRef.resolve(JwtAuthGuard, contextId, { strict: false });
      return jwtGuard.validateToken(context);
    }

    return true;
  }

  protected async validateRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authTypes =
      this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? AuthGuard.defaultAuthTypes;

    if (authTypes.includes(AuthType.Bearer)) {
      const contextId = ContextIdFactory.getByRequest(request);
      const jwtGuard = await this.moduleRef.resolve(JwtAuthGuard, contextId, { strict: false });
      return jwtGuard.validateToken(context);
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
