import { ValidationError } from '@/common/pipes/interfaces';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

function prettifyFieldName(field: string): string {
  if (!field || typeof field !== 'string') return '';

  const spaced = field
    .replace(/([A-Z])/g, ' $1')
    .replace(/\./g, ' ')
    .toLowerCase()
    .trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function extractValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): { field: string; message: string }[] {
  return errors.flatMap((error) => {
    if (!error || typeof error !== 'object') return [];

    const propertyPath =
      parentPath && error.property ? `${parentPath}.${error.property}` : (error.property ?? '');

    let extracted: { field: string; message: string }[] = [];

    if (error.constraints) {
      const prettyField = prettifyFieldName(propertyPath);
      const firstMessage = Object.values(error.constraints).find((msg) => typeof msg === 'string');

      if (firstMessage) {
        const escapedProperty = error.property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const message = firstMessage.replace(new RegExp(escapedProperty, 'g'), prettyField);

        extracted.push({ field: propertyPath, message });
      }
    }

    if (error.children && error.children.length > 0) {
      extracted = extracted.concat(extractValidationErrors(error.children, propertyPath));
    }

    return extracted;
  });
}

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
