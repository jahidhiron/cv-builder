import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Ensures all items in an array have unique values for a specified property.
 */
export function IsUniqueItemProperty<T = any>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'uniqueItemProperty',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;

          const prop = args.constraints[0] as keyof T;

          // Narrow each item to object safely
          const values: unknown[] = value.reduce<unknown[]>((acc, v) => {
            if (v !== null && typeof v === 'object') {
              acc.push((v as Record<string, unknown>)[String(prop)]);
            }
            return acc;
          }, []);

          return values.length === new Set(values).size;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must have unique ${String(args.constraints[0])} values`;
        },
      },
    });
  };
}
