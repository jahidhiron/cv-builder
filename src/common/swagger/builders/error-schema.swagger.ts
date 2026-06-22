import { buildErrorExample } from './error-example.swagger';
import { DECORATOR_MAP } from './error-schema.utils';
import { ResponseArgs, StatusKey } from '../types';

/**
 * Returns a NestJS Swagger `@Api*Response` decorator instance for a given HTTP error status.
 *
 * Selects the appropriate decorator from `DECORATOR_MAP` and builds the response body
 * using {@link buildErrorExample}. Supports both a single example and a named
 * `examples` map for routes with multiple distinct error shapes.
 *
 * @param statusKey   - HTTP status key (e.g. `"NOT_FOUND"`, `"CONFLICT"`).
 * @param description - Human-readable description shown in Swagger UI.
 * @param args        - Path, method, optional error list, and optional examples map.
 * @returns A class/method decorator applied via `@buildErrorSchema(…)`.
 */
export function buildErrorSchema(statusKey: StatusKey, description: string, args: ResponseArgs) {
  const hasExamples = 'examples' in args && args.examples && Object.keys(args.examples).length > 0;

  const content = hasExamples
    ? {
        'application/json': {
          examples: Object.entries(args.examples).reduce(
            (acc, [key, ex]) => {
              acc[key] = {
                summary: ex.summary ?? description,
                value: buildErrorExample({
                  path: args.path,
                  method: args.method,
                  statusKey,
                  message: description,
                  errors: ex.errors,
                  data: ex.data,
                }),
              };
              return acc;
            },
            {} as Record<string, { summary?: string; value: unknown }>,
          ),
        },
      }
    : {
        'application/json': {
          example: buildErrorExample({
            path: args.path,
            method: args.method,
            statusKey,
            message: description,
            errors: 'errors' in args ? args.errors : undefined,
            data: 'data' in args ? args.data : undefined,
          }),
        },
      };

  return DECORATOR_MAP[statusKey]({ description, content });
}
