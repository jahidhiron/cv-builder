import { applyDecorators } from '@nestjs/common';
import { Matches } from 'class-validator';

/**
 * Requires at least one uppercase letter, one lowercase letter, one digit,
 * and one special character. Apply after `@MinLength` / `@MaxLength`.
 */
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]).+$/;

export function IsStrongPassword(): PropertyDecorator {
  return applyDecorators(
    Matches(STRONG_PASSWORD_REGEX, {
      message:
        '$property must contain at least one uppercase letter, lowercase letter, number, and special character',
    }),
  );
}
