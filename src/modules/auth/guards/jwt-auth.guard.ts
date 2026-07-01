import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { JwtService } from '@/shared/jwt';
import { RedisService } from '@/shared/redis/redis.service';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BaseAuthGuard } from './base-auth.guard';

/**
 * Guards HTTP routes that require a valid JWT access token.
 *
 * Token resolution order (first match wins):
 * 1. `accessToken` cookie — preferred for browser clients.
 * 2. `Authorization: Bearer <token>` header — for API/mobile clients.
 *
 * Additional checks:
 * - The token must not appear in the Redis blacklist (set on logout / token rotation).
 * - The token must pass JWT signature and expiry verification against `accessSecret`.
 *
 * On success, attaches `request.user` as a {@link UserPayload} so downstream
 * handlers and other guards can access the authenticated identity.
 */
@Injectable()
export class JwtAuthGuard extends BaseAuthGuard {
  constructor(
    protected override readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    super(reflector);
  }

  validateToken(context: ExecutionContext): Promise<boolean> {
    return this.validateRequest(context);
  }

  protected async validateRequest(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const isBlacklisted = await this.redisService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const payload = this.jwtService.verifyAccessToken<JwtPayload>(token);
      request.user = {
        id: Number(payload.sub),
        name: payload.name,
        email: payload.email,
        roleId: payload.roleId,
        roleKey: payload.roleKey,
        role: payload.role,
        permissions: payload.permissions ?? [],
        familyId: payload.familyId,
        sessionId: payload.sessionId,
      };
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException(
        error.name === 'JsonWebTokenError' ? 'Unauthorized' : (error.message ?? 'Unauthorized'),
      );
    }
  }

  private extractToken(request: Request): string | null {
    const cookies = request.cookies as Record<string, string | undefined>;
    const cookieToken = cookies['accessToken'];
    if (cookieToken) return cookieToken;

    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);

    return null;
  }
}
