import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ClassConstructor {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  new (...args: any[]): {};
}

interface StandardResponse<T> {
  method: string;
  success: boolean;
  status: string;
  statusCode: number;
  path: string;
  timestamp: string;
  message: string;
  data: T;
}

function hasDataProperty<T>(input: unknown): input is StandardResponse<T> {
  return (
    typeof input === 'object' &&
    input !== null &&
    'data' in input &&
    typeof (input as Record<string, unknown>).data === 'object' &&
    (input as Record<string, unknown>).data !== null
  );
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor) {}

  intercept(
    _context: ExecutionContext,
    handler: CallHandler,
  ): Observable<StandardResponse<unknown>> {
    return handler.handle().pipe(
      map((response: unknown): StandardResponse<unknown> => {
        if (hasDataProperty(response)) {
          return {
            ...response,
            data: plainToInstance(this.dto, response.data, {
              excludeExtraneousValues: true,
            }),
          };
        }
        return response as StandardResponse<unknown>;
      }),
    );
  }
}
