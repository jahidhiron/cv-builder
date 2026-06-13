import { handle } from '@/common/helpers';
import {
  ListParams,
  ListResult,
  PaginatedListParams,
  PaginatedResult,
  RangeCondition,
} from '@/common/repositories/interfaces';
import { AppLogger } from '@/config/logger';
import { ErrorResponse } from '@/shared/response';
import { Injectable } from '@nestjs/common';
import {
  Brackets,
  DataSource,
  DeepPartial,
  EntityManager,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

/**
 * Generic base repository that provides common CRUD, search, pagination,
 * and transaction operations for any TypeORM entity.
 *
 * Concrete repositories should extend this class and pass the entity
 * constructor, a query-builder alias, and shared dependencies through
 * `super(...)`.
 *
 * Every public method wraps its database call in the shared `handle`
 * helper so errors are normalised and logged consistently across the
 * application.
 *
 * @template T - The TypeORM entity type managed by this repository.
 */
@Injectable()
export class BaseRepository<T extends ObjectLiteral> {
  /** The underlying TypeORM repository instance. Exposed for ad-hoc query builder access in subclasses. */
  public readonly repo: Repository<T>;

  /**
   * @param dataSource   - Active TypeORM DataSource injected by NestJS.
   * @param entity       - Entity constructor used to obtain the TypeORM repository.
   * @param alias        - Default query-builder alias for this entity (e.g. `'user'`).
   * @param errorResponse - Shared error-response factory used by the `handle` wrapper.
   * @param logger       - Application logger instance.
   */
  constructor(
    protected readonly dataSource: DataSource,
    entity: new () => T,
    private readonly alias: string,
    protected readonly errorResponse: ErrorResponse,
    protected readonly logger: AppLogger,
  ) {
    this.repo = this.dataSource.getRepository(entity);
  }

  /**
   * Returns the repository bound to `manager` when a transaction context is
   * provided, otherwise returns the default repository.
   *
   * @param manager - Optional transaction `EntityManager`.
   */
  private getRepo(manager?: EntityManager): Repository<T> {
    return manager ? manager.getRepository<T>(this.repo.target) : this.repo;
  }

  /**
   * Creates a `SelectQueryBuilder` for the entity using the given alias,
   * falling back to the class-level alias when none is supplied.
   *
   * Use this in subclasses when you need full query-builder control beyond
   * what the base methods offer.
   *
   * @param alias - Optional alias override for the root entity.
   * @returns A fresh `SelectQueryBuilder<T>`.
   */
  public createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.repo.createQueryBuilder(alias ?? this.alias);
  }

  /**
   * Finds a single entity matching `where`. Returns `null` when no row is found.
   *
   * @param where   - TypeORM `FindOptionsWhere` conditions.
   * @param options - Optional relations to eager-load, column selection, and sort order.
   * @param manager - Optional transaction context.
   * @returns The matched entity or `null`.
   */
  async findOne(
    where: FindOptionsWhere<T>,
    options?: {
      relations?: FindOptionsRelations<T>;
      select?: FindOptionsSelect<T>;
      order?: FindOptionsOrder<T>;
    },
    manager?: EntityManager,
  ): Promise<T | null> {
    return handle(
      async () => {
        const findOptions: FindOneOptions<T> = {
          where,
          relations: options?.relations,
          select: options?.select,
          order: options?.order,
        };
        return this.getRepo(manager).findOne(findOptions);
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Finds all entities matching `where`. Accepts an array of conditions
   * (OR semantics) or a single conditions object (AND semantics).
   *
   * @param where   - One or more `FindOptionsWhere` condition objects.
   * @param options - Optional relations, column selection, sort order, and pagination slice.
   * @param manager - Optional transaction context.
   * @returns Array of matched entities, or an empty array.
   */
  async findMany(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    options?: {
      relations?: FindOptionsRelations<T>;
      select?: FindOptionsSelect<T>;
      order?: FindOptionsOrder<T>;
      take?: number;
      skip?: number;
    },
    manager?: EntityManager,
  ): Promise<T[]> {
    return handle(
      async () => this.getRepo(manager).find({ where, ...options }),
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Counts entities matching the given conditions.
   *
   * @param where   - Optional `FindOptionsWhere` conditions. Omitting counts all rows.
   * @param manager - Optional transaction context.
   * @returns Total number of matching rows.
   */
  async count(where?: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    return handle(
      async () => this.getRepo(manager).count({ where }),
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Returns `true` if at least one entity matches the given conditions.
   * More efficient than `findOne` when you only need to check existence.
   *
   * @param where   - `FindOptionsWhere` conditions.
   * @param manager - Optional transaction context.
   * @returns `true` if a matching row exists, `false` otherwise.
   */
  async exists(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<boolean> {
    return handle(
      async () => this.getRepo(manager).exists({ where }),
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Creates and persists a single entity.
   *
   * @param data    - Partial entity data to insert.
   * @param manager - Optional transaction context.
   * @returns The newly created entity, including any database-generated fields.
   */
  async create(data: DeepPartial<T>, manager?: EntityManager): Promise<T> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        return repo.save(repo.create(data));
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Creates and persists multiple entities in a single `save` call.
   *
   * @param data    - Array of partial entity data to insert.
   * @param manager - Optional transaction context.
   * @returns Array of newly created entities.
   */
  async createMany(data: DeepPartial<T>[], manager?: EntityManager): Promise<T[]> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        return repo.save(repo.create(data));
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Inserts or updates entity data using PostgreSQL `ON CONFLICT DO UPDATE`.
   *
   * When a row with a matching value for any of the `conflictPaths` columns
   * already exists, its non-conflict columns are updated. Otherwise a new row
   * is inserted.
   *
   * @param data          - Single entity or array of entities to upsert.
   * @param conflictPaths - Column names that define the uniqueness constraint
   *                        (e.g. `['email']` or `['user_id', 'plan_id']`).
   * @param manager       - Optional transaction context.
   */
  async upsert(
    data: DeepPartial<T> | DeepPartial<T>[],
    conflictPaths: (keyof T & string)[],
    manager?: EntityManager,
  ): Promise<void> {
    return handle(
      async () => {
        await this.getRepo(manager).upsert(
          data as unknown as Parameters<Repository<T>['upsert']>[0],
          conflictPaths,
        );
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Finds a single entity by `where`, merges `data` into it, and persists
   * the result. Returns `null` when no matching row is found.
   *
   * Uses TypeORM's `merge` so only the supplied fields are overwritten;
   * existing fields are left intact.
   *
   * @param where   - Conditions identifying the row to update.
   * @param data    - Partial data to merge into the found entity.
   * @param manager - Optional transaction context.
   * @returns The updated entity, or `null` if no row matched.
   */
  async update(
    where: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        const entity = await repo.findOne({ where });
        if (!entity) return null;
        return repo.save(repo.merge(entity, data));
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Finds all entities matching `where`, merges `data` into each one, and
   * persists them. Returns an empty array when no rows match.
   *
   * @param where   - Conditions identifying the rows to update.
   * @param data    - Partial data to merge into every matched entity.
   * @param manager - Optional transaction context.
   * @returns Array of updated entities.
   */
  async updateMany(
    where: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        const entities = await repo.find({ where });
        if (!entities.length) return [];
        return repo.save(entities.map((e) => repo.merge(e, data)));
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Atomically increments a numeric column by `value` for all rows matching
   * `where`. Executes a single `UPDATE … SET col = col + n` statement.
   *
   * Useful for counters such as `failed_attempts` or `download_count`.
   *
   * @param where   - Conditions identifying which rows to increment.
   * @param field   - Name of the numeric column to increment.
   * @param value   - Amount to add (default: `1`).
   * @param manager - Optional transaction context.
   */
  async increment(
    where: FindOptionsWhere<T>,
    field: keyof T & string,
    value = 1,
    manager?: EntityManager,
  ): Promise<void> {
    return handle(
      async () => {
        await this.getRepo(manager).increment(where, field, value);
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Atomically decrements a numeric column by `value` for all rows matching
   * `where`. Executes a single `UPDATE … SET col = col - n` statement.
   *
   * @param where   - Conditions identifying which rows to decrement.
   * @param field   - Name of the numeric column to decrement.
   * @param value   - Amount to subtract (default: `1`).
   * @param manager - Optional transaction context.
   */
  async decrement(
    where: FindOptionsWhere<T>,
    field: keyof T & string,
    value = 1,
    manager?: EntityManager,
  ): Promise<void> {
    return handle(
      async () => {
        await this.getRepo(manager).decrement(where, field, value);
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Finds a single entity matching `where` and permanently removes it from
   * the database. Returns `null` when no matching row is found.
   *
   * Deletion is performed via `repo.remove(entity)` (by primary key) to
   * guarantee only the found row is affected.
   *
   * @param where   - Conditions identifying the row to delete.
   * @param manager - Optional transaction context.
   * @returns The deleted entity (primary key cleared by TypeORM), or `null`.
   */
  async remove(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<T | null> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        const entity = await repo.findOne({ where });
        if (!entity) return null;
        return repo.remove(entity);
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Finds all entities matching `where` and permanently removes them in a
   * single `repo.remove` call. Returns an empty array when no rows match.
   *
   * @param where   - Conditions identifying the rows to delete.
   * @param manager - Optional transaction context.
   * @returns Array of deleted entities (primary keys cleared by TypeORM).
   */
  async removeMany(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<T[]> {
    return handle(
      async () => {
        const repo = this.getRepo(manager);
        const entities = await repo.find({ where });
        if (!entities.length) return [];
        return repo.remove(entities);
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Executes `fn` inside a database transaction managed by the DataSource.
   *
   * The `EntityManager` passed to `fn` is scoped to the transaction. Pass it
   * as the `manager` argument to any base-repository method to enlist those
   * operations in the same transaction.
   *
   * ```ts
   * await this.transaction(async (manager) => {
   *   await this.userRepo.create(userData, manager);
   *   await this.profileRepo.create(profileData, manager);
   * });
   * ```
   *
   * @param fn - Async function that receives the transaction `EntityManager`.
   * @returns The value returned by `fn`.
   */
  async transaction<R>(fn: (manager: EntityManager) => Promise<R>): Promise<R> {
    return handle(() => this.dataSource.transaction(fn), this.errorResponse, this.logger);
  }

  /**
   * Builds a `SelectQueryBuilder` from the supplied list/paginated params.
   * Handles relation joins, WHERE conditions, range filters, full-text search,
   * column selection, sorting, and optional offset pagination.
   *
   * @param params - Combined `PaginatedListParams` with an optional `paginate` flag.
   * @returns The configured query builder plus resolved `page`, `limit`, and `paginate` values.
   */
  private buildListQuery(params: PaginatedListParams<T> & { paginate?: boolean }) {
    const {
      q,
      searchBy,
      query,
      sortBy,
      relations,
      select,
      page = 1,
      limit = 10,
      paginate = false,
    } = params;

    const qb = this.createQueryBuilder(this.alias);
    const joinedAliases: Record<string, string> = {};

    /* JOIN RELATIONS */
    const joinRelations = (rels: FindOptionsRelations<unknown>, parent = this.alias): void => {
      for (const [key, value] of Object.entries(rels)) {
        const path = `${parent}.${key}`;
        const alias = `${parent}_${key}_${Object.keys(joinedAliases).length}`;

        if (
          joinedAliases[path] ||
          qb.expressionMap.joinAttributes.some(
            (j) => j.alias?.name === alias || j.relation?.propertyPath === path,
          )
        )
          continue;

        qb.leftJoinAndSelect(path, alias);
        joinedAliases[path] = alias;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          joinRelations(value as FindOptionsRelations<unknown>, alias);
        }
      }
    };

    if (relations) joinRelations(relations);

    /* WHERE CLAUSES */
    const applyConditions = (obj: Record<string, unknown>, parentAlias = this.alias): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          if (
            '$gte' in value ||
            '$lte' in value ||
            '$gt' in value ||
            '$lt' in value ||
            '$eq' in value
          ) {
            const rangeValue = value as RangeCondition;
            const column = `${parentAlias}.${key}`;
            const paramKey = `${parentAlias.replace(/\./g, '_')}_${key}`;
            const pk = paramKey.replace(/[${}]/g, '_');

            if (rangeValue.$gte !== undefined)
              qb.andWhere(`${column} >= :${pk}_gte`, { [`${pk}_gte`]: rangeValue.$gte });
            if (rangeValue.$lte !== undefined)
              qb.andWhere(`${column} <= :${pk}_lte`, { [`${pk}_lte`]: rangeValue.$lte });
            if (rangeValue.$gt !== undefined)
              qb.andWhere(`${column} > :${pk}_gt`, { [`${pk}_gt`]: rangeValue.$gt });
            if (rangeValue.$lt !== undefined)
              qb.andWhere(`${column} < :${pk}_lt`, { [`${pk}_lt`]: rangeValue.$lt });
            if (rangeValue.$eq !== undefined)
              qb.andWhere(`${column} = :${pk}_eq`, { [`${pk}_eq`]: rangeValue.$eq });
          } else {
            const relationPath = `${parentAlias}.${key}`;
            const relationAlias =
              joinedAliases[relationPath] ||
              `${parentAlias}_${key}_${Object.keys(joinedAliases).length}`;
            applyConditions(value as Record<string, unknown>, relationAlias);
          }
        } else if (value !== undefined) {
          const column = `${parentAlias}.${key}`;
          const paramKey = `${parentAlias.replace(/\./g, '_')}_${key}`;
          qb.andWhere(`${column} = :${paramKey}`, {
            [paramKey]: value as string | number | boolean | Date,
          });
        }
      }
    };

    if (query) applyConditions(query);

    /* SELECT */
    if (select) {
      qb.select(Object.keys(select).map((key) => `${this.alias}.${key}`));
    }

    /* SEARCH */
    if (q && searchBy?.length) {
      const likeOperator = this.dataSource.options.type === 'postgres' ? 'ILIKE' : 'LIKE';

      qb.andWhere(
        new Brackets((qb2) => {
          searchBy.forEach((rawField, index) => {
            const field = String(rawField);
            const param = `search${index}`;
            let condition: string;

            if (field.includes('.')) {
              const parts = field.split('.');
              const relationPath = `${this.alias}.${parts.slice(0, -1).join('.')}`;
              const column = parts[parts.length - 1];
              const relationAlias =
                joinedAliases[relationPath] ||
                `${this.alias}_${parts[parts.length - 2]}_${Object.keys(joinedAliases).length}`;
              condition = `${relationAlias}.${column} ${likeOperator} :${param}`;
            } else {
              condition = `${this.alias}.${field} ${likeOperator} :${param}`;
            }

            const paramValue = { [param]: `%${q}%` };
            if (index === 0) qb2.where(condition, paramValue);
            else qb2.orWhere(condition, paramValue);
          });
        }),
      );
    }

    /* SORTING */
    if (sortBy?.length) {
      sortBy.forEach((s) => {
        const order = s.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const field = String(s.whom);

        if (field.includes('.')) {
          const [relation, column] = field.split('.');
          const relationPath = `${this.alias}.${relation}`;
          const relationAlias =
            joinedAliases[relationPath] ||
            `${this.alias}_${relation}_${Object.keys(joinedAliases).length}`;
          if (
            !qb.expressionMap.joinAttributes.some(
              (j) => j.alias?.name === relationAlias || j.relation?.propertyPath === relationPath,
            )
          ) {
            qb.leftJoin(`${this.alias}.${relation}`, relationAlias);
          }
          qb.addOrderBy(`${relationAlias}.${column}`, order);
        } else {
          qb.addOrderBy(`${this.alias}.${field}`, order);
        }
      });
    } else {
      qb.addOrderBy(`${this.alias}.id`, 'DESC');
    }

    if (paginate) qb.skip((page - 1) * limit).take(limit);

    return { qb, page, limit, paginate };
  }

  /**
   * Returns all entities matching the given list params as a flat array.
   * No pagination is applied — use `paginatedList` when you need page/total metadata.
   *
   * Supports full-text search, relation joins, range filters, sorting, and column selection.
   *
   * @param params - Search, filter, sort, and relation options. All fields are optional.
   * @returns `{ items }` — the matched entities.
   */
  async list(params: ListParams<T> = {}): Promise<ListResult<T>> {
    return handle(
      async () => {
        const { qb } = this.buildListQuery({ ...params, paginate: false });
        return { items: await qb.getMany() };
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Returns a paginated subset of entities along with total count and page metadata.
   *
   * Supports the same filtering, search, and sorting capabilities as `list`.
   *
   * @param params - Search, filter, sort, relation, and pagination options (`page`, `limit`).
   * @returns `{ items, meta }` where `meta` contains `total`, `pages`, and `currentPage`.
   */
  async paginatedList(params: PaginatedListParams<T> = {}): Promise<PaginatedResult<T>> {
    return handle(
      async () => {
        const { qb, page, limit } = this.buildListQuery({ ...params, paginate: true });
        const [items, total] = await qb.getManyAndCount();
        return {
          items,
          meta: {
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
          },
        };
      },
      this.errorResponse,
      this.logger,
    );
  }

  /**
   * Executes a raw SQL query and returns the result rows cast to `R`.
   *
   * Use this only when the query-builder or TypeORM's `find*` API cannot
   * express what you need (e.g. complex CTEs, window functions, bulk upserts
   * with returning clauses).
   *
   * **Always use parameterised queries** — pass user-supplied values via
   * `parameters` instead of string interpolation to prevent SQL injection.
   *
   * ```ts
   * const rows = await this.rawQuery<{ id: bigint }>(
   *   'SELECT id FROM users WHERE email = $1',
   *   [email],
   * );
   * ```
   *
   * @param query      - Raw SQL string with positional placeholders (`$1`, `$2`, …).
   * @param parameters - Ordered array of values bound to the placeholders.
   * @param manager    - Optional transaction context.
   * @returns Array of result rows typed as `R`.
   */
  async rawQuery<R = unknown>(
    query: string,
    parameters: unknown[] = [],
    manager?: EntityManager,
  ): Promise<R[]> {
    return handle(
      async () => {
        const result: unknown = await this.getRepo(manager).query(query, parameters);
        return result as R[];
      },
      this.errorResponse,
      this.logger,
    );
  }
}
