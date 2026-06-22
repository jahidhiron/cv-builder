import { CallHandler, ExecutionContext, NestInterceptor, Type, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardResponse } from './interfaces';
import { hasDataProperty } from './serialize.utils';

/**
 * Decorator that applies `SerializeInterceptor` to a controller or route handler.
 *
 * @param dto - DTO class used by `class-transformer` to strip unlisted fields.
 */
export function Serialize(dto: Type<unknown>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

/**
 * Strips unlisted properties from the `data` field of a {@link StandardResponse}
 * using `class-transformer`'s `plainToInstance` with `excludeExtraneousValues: true`.
 *
 * Applied via the {@link Serialize} decorator rather than instantiated directly.
 */
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: Type<unknown>) {}

  /**
   * Intercepts the handler response and serialises `response.data` through the DTO class.
   * Responses that do not carry a `data` object are passed through unchanged.
   */
  intercept(_context: ExecutionContext, handler: CallHandler): Observable<StandardResponse> {
    return handler.handle().pipe(
      map((response: unknown): StandardResponse => {
        if (hasDataProperty(response)) {
          return {
            ...response,
            data: plainToInstance(this.dto, response.data, {
              excludeExtraneousValues: true,
            }),
          };
        }
        return response as StandardResponse;
      }),
    );
  }
}
