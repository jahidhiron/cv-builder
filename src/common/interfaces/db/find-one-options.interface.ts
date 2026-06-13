import { FindOptionsOrder, FindOptionsRelations, FindOptionsSelect } from 'typeorm';

/**
 * Options for finding a single entity.
 *
 * @template T - The entity type.
 */
export interface FindOneOptions<T> {
  /**
   * Relations to load with the entity.
   */
  relations?: FindOptionsRelations<T>;

  /**
   * Fields to select from the entity.
   */
  select?: FindOptionsSelect<T>;

  /**
   * Order of the returned entity.
   */
  order?: FindOptionsOrder<T>;
}
