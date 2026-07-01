import { clientIp } from '@/common/utils';
import { RATE_LIMIT_KEY } from '@/shared/rate-limit/constants/rate-limit.constant';
import type { RateLimitOptions } from '@/shared/rate-limit/interfaces/rate-limit-options.interface';
import { RateLimitService } from '@/shared/rate-limit/rate-limit.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Enforces per-route rate limits defined by the {@link RateLimit} decorator.
 *
 * On each request the guard reads {@link RateLimitOptions} from route metadata
 * via `Reflector`. If no options are attached the route passes through
 * unconditionally. Otherwise every identifier field listed in
 * `options.identifiers` is resolved — `'ip'` maps to the client IP address,
 * any other value is read from `request.body` — and
 * {@link RateLimitService.checkLimit} is called for each resolved value.
 * A missing identifier is silently skipped rather than blocking the request.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  /**
   * @param reflector - Reads {@link RateLimitOptions} metadata attached by {@link RateLimit}.
   * @param rateLimitService - Service used to check and record each resolved identifier.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Evaluate rate-limit rules for the incoming request.
   *
   * **Steps:**
   * 1. **Read metadata** — retrieve {@link RateLimitOptions} attached by
   *    {@link RateLimit}; bypass the guard entirely if none are found.
   * 2. **Extract request** — pull the HTTP `Request` from the execution context.
   * 3. **Resolve identifiers** — for each field in `options.identifiers` derive
   *    the tracking key (`clientIp` for `'ip'`, or the matching body field).
   * 4. **Check limits** — call {@link RateLimitService.checkLimit} for every
   *    non-empty identifier; throws `TooManyRequestsException` if exceeded.
   *
   * @param context - NestJS execution context providing request and handler metadata.
   * @returns `true` when all limit checks pass; throws before returning otherwise.
   * @throws {TooManyRequestsException} When an identifier has exceeded its allowed
   *         request count within the configured window.
   */
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
