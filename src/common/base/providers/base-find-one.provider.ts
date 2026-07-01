import type { ObjectLiteral } from 'typeorm';
import { BaseProvider } from './base.provider';

/**
 * Marker base class for all "find one" operation providers.
 *
 * Adds no behaviour — its purpose is naming consistency: every provider
 * whose sole job is retrieving a single entity extends this class rather
 * than `BaseProvider` directly, making the intent clear at a glance.
 *
 * Concrete subclasses implement `execute` and inherit `findOne` from
 * {@link BaseProvider#findOne}.
 *
 * @template T - The TypeORM entity type managed by this provider.
 */
export abstract class BaseFindOneProvider<T extends ObjectLiteral> extends BaseProvider<T> {}
