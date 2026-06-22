import { clientIp } from '@/common/utils';
import { AppLogger } from '@/config/logger';
import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * Logs every HTTP request via the application's Winston-backed logger.
 *
 * Emits one `info` line per response (success or error):
 * `[METHOD] /path | ip=x.x.x.x → STATUS | Xms`
 *
 * For errors, the status code is derived from the thrown {@link HttpException};
 * non-HTTP exceptions default to 500. The {@link GlobalExceptionFilter} still
 * logs the full stack trace separately — this line is the per-request summary.
 */
@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - start;
          this.logger.log(
            `[${req.method}] ${req.url} | ip=${clientIp(req)} → ${res.statusCode} | ${duration}ms`,
            'HTTP',
          );
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          const duration = Date.now() - start;
          this.logger.log(
            `[${req.method}] ${req.url} | ip=${clientIp(req)} → ${status} | ${duration}ms`,
            'HTTP',
          );
        },
      }),
    );
  }
}
