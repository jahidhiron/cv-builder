import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { extractValidationErrors } from './validation.utils';

/**
 * Constructs the application's global `ValidationPipe`.
 *
 * Configuration:
 * - `whitelist: true` — strips properties not listed in the DTO.
 * - `forbidNonWhitelisted: true` — throws 400 when unexpected properties are present.
 * - `transform: true` — auto-converts request payloads to DTO class instances.
 * - `enableImplicitConversion: false` — requires explicit `@Type()` decorators;
 *   prevents silent coercion bugs.
 * - Custom `exceptionFactory` — maps class-validator errors to the application's
 *   structured `{ errors: [{ field, message }] }` format.
 *
 * Applied globally via `app.useGlobalPipes(…, validationPipe())` in `app.ts`.
 */
export function validationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (validationErrors = []) => {
      const formattedErrors = extractValidationErrors(validationErrors);

      return new BadRequestException({
        statusCode: 400,
        status: 'BAD_REQUEST',
        message: 'Validation Error',
        errors: formattedErrors.length
          ? formattedErrors
          : [{ field: 'unknown', message: 'Invalid request data' }],
      });
    },
  });
}
