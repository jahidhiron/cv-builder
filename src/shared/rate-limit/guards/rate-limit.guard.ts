import { clientIp } from '@/common/utils';
import { RATE_LIMIT_KEY } from '@/shared/rate-limit/constants/rate-limit.constant';
import type { RateLimitOptions } from '@/shared/rate-limit/interfaces/rate-limit-options.interface';
import { RateLimitService } from '@/shared/rate-limit/rate-limit.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());

    if (!options) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const { action, identifiers, maxAttempts, windowMs = 15 * 60 * 1000 } = options;

    for (const field of identifiers) {
      let identifier: string | undefined;

      if (field === 'ip') {
        identifier = clientIp(request);
      } else {
        identifier = (request.body as Record<string, string>)?.[field];
      }

      if (!identifier) continue;

      await this.rateLimitService.checkLimit({ identifier, action, maxAttempts, windowMs });
    }

    return true;
  }
}
