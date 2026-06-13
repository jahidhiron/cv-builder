import { FindOneOptions } from '@/common/interfaces';
import { BaseRepository } from '@/common/repositories';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ObjectLiteral } from 'typeorm';

/**
 * Generic provider for retrieving a single entity from a repository.
 *
 * @template T - The entity type, must extend ObjectLiteral.
 * @template R - The repository type for T.
 */
@Injectable()
export class FindOneProvider<T extends ObjectLiteral, R extends BaseRepository<T>> {
  constructor(protected readonly repository: R) {}

  /**
   * Finds a single entity matching the given query.
   *
   * @param where - Filter object specifying search criteria.
   * @param options - Optional query options (relations, select, order).
   * @returns A promise resolving to the found entity or null if not found.
   */
  async execute(where: FindOptionsWhere<T>, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(where, options);
  }
}
