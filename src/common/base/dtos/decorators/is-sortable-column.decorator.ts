import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { SortByDto } from '../sort-by.dto';

/**
 * Property decorator that validates every `SortByDto` item in the array has a
 * `whom` value present in the provided `columns` allowlist.
 *
 * Non-array values pass validation silently (guarded by `IsArray` upstream).
 * Items missing the `whom` key or whose value is not in `columns` fail validation.
 *
 * @param columns          - Allowlist of column names the caller may sort by.
 * @param validationOptions - Standard class-validator options (e.g. custom `message`).
 *
 */
export function IsSortableColumn(
  columns: string[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyKey: string | symbol) {
    registerDecorator({
      name: 'isSortableColumn',
      target: object.constructor,
      propertyName: String(propertyKey),
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
