import { JwtPayload, UserPayload } from '@/modules/auth/interfaces';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { BaseAuthGuard } from './base-auth.guard';

@Injectable()
export class JwtAuthGuard extends BaseAuthGuard {
  constructor(
    protected readonly reflector: Reflector,
    private readonly jwtService: JwtService,
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

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        roleId: payload.roleId,
        roleKey: payload.roleKey,
        role: payload.role,
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
    const cookieToken = (request as Request & { cookies?: Record<string, string> }).cookies?.accessToken;
    if (cookieToken) return cookieToken;

    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);

    return null;
  }
}
