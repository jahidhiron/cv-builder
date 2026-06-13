import { AUTH_TYPE_KEY } from '@/modules/auth/constants/auth.constant';
import { AuthType } from '@/modules/auth/enums';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { BaseAuthGuard } from './base-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AuthGuard extends BaseAuthGuard {
  private static readonly defaultAuthTypes = [AuthType.Bearer];

  constructor(
    private readonly moduleRef: ModuleRef,
    protected readonly reflector: Reflector,
  ) {
    super(reflector);
  }

  protected async handleOptional(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;
    const cookieToken = (request as Request & { cookies?: Record<string, string> }).cookies?.accessToken;

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
