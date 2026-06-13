import { buildResponse } from '@/common/swagger/build-response.swagger';
import { ResponseArgs, StatusKey } from '@/common/swagger/types';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

export function buildSchema(statusKey: StatusKey, description: string, args: ResponseArgs) {
  const hasExamples = 'examples' in args && args.examples && Object.keys(args.examples).length > 0;

  const content = hasExamples
    ? {
        'application/json': {
          examples: Object.entries(args.examples).reduce(
            (acc, [key, ex]) => {
              acc[key] = {
                summary: ex.summary ?? description,
                value: buildResponse({
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
          example: buildResponse({
            path: args.path,
            method: args.method,
            statusKey,
            message: description,
            errors: 'errors' in args ? args.errors : undefined,
            data: 'data' in args ? args.data : undefined,
          }),
        },
      };

  switch (statusKey) {
    case 'BAD_REQUEST':
      return ApiBadRequestResponse({ description, content });
    case 'UNAUTHORIZED':
      return ApiUnauthorizedResponse({ description, content });
    case 'FORBIDDEN':
      return ApiForbiddenResponse({ description, content });
    case 'NOT_FOUND':
      return ApiNotFoundResponse({ description, content });
    case 'CONFLICT':
      return ApiConflictResponse({ description, content });
    case 'UNPROCESSABLE_ENTITY':
      return ApiUnprocessableEntityResponse({ description, content });
    case 'TOO_MANY_REQUESTS':
      return ApiTooManyRequestsResponse({ description, content });
    case 'INTERNAL_SERVER_ERROR':
      return ApiInternalServerErrorResponse({ description, content });
    case 'SERVICE_UNAVAILABLE':
      return ApiServiceUnavailableResponse({ description, content });
  }
}
