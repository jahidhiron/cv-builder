import { SortByDto } from '@/common/dtos';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Validates that each item in an array has a `whom` property included in allowed columns.
 */
export function IsSortableColumn(columns: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSortableColumn',
      target: object.constructor,
      propertyName,
      constraints: [columns],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const allowedColumns = args.constraints[0] as string[];

          if (!Array.isArray(value)) return true;

          return value.every((v) => {
            if (v && typeof v === 'object' && 'whom' in v) {
              const whom = (v as SortByDto).whom;
              return typeof whom === 'string' && allowedColumns.includes(whom);
            }
            return false;
          });
        },
        defaultMessage(args: ValidationArguments): string {
          const allowedColumns = args.constraints[0] as string[];
          return `${args.property} must be one of the possible values: ${allowedColumns.join(', ')}`;
        },
      },
    });
  };
}
