import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

/**
 * Custom TypeORM naming strategy that converts all identifiers to snake_case.
 *
 * Applied globally via `NamingStrategy` in {@link getBaseDatabaseConfig} so that
 * entity property names (camelCase) are automatically mapped to snake_case column,
 * table, and relation names without requiring explicit `@Column({ name: '...' })`
 * annotations on every field.
 */
export class NamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  /** @inheritdoc */
  override tableName(targetName: string, userSpecifiedName?: string): string {
    return userSpecifiedName || snakeCase(targetName);
  }

  /** @inheritdoc */
  override columnName(propertyName: string, customName?: string, embeddedPrefixes: string[] = []): string {
    return snakeCase(
      embeddedPrefixes.join('_') +
        (embeddedPrefixes.length ? '_' : '') +
        (customName || propertyName),
    );
  }

  /** @inheritdoc */
  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }
}
