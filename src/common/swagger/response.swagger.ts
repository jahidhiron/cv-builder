import { buildSchema } from '@/common/swagger/build-schema.swagger';
import { ResponseArgs } from '@/common/swagger/types';

/** One function per status — accepts either single or examples */
export const BadRequestResponse = (args: ResponseArgs) =>
  buildSchema('BAD_REQUEST', 'Bad Request', args);

export const UnauthorizedResponse = (args: ResponseArgs) =>
  buildSchema('UNAUTHORIZED', 'Unauthorized', args);

export const ForbiddenResponse = (args: ResponseArgs) =>
  buildSchema('FORBIDDEN', 'Forbidden', args);

export const NotFoundResponse = (args: ResponseArgs) => buildSchema('NOT_FOUND', 'Not Found', args);

export const ConflictResponse = (args: ResponseArgs) => buildSchema('CONFLICT', 'Conflict', args);

export const UnprocessableEntityResponse = (args: ResponseArgs) =>
  buildSchema('UNPROCESSABLE_ENTITY', 'Unprocessable Entity', args);

export const TooManyRequestsResponse = (args: ResponseArgs) =>
  buildSchema('TOO_MANY_REQUESTS', 'Too Many Requests', args);

export const InternalServerErrorResponse = (args: ResponseArgs) =>
  buildSchema('INTERNAL_SERVER_ERROR', 'Internal Server Error', args);

export const ServiceUnavailableResponse = (args: ResponseArgs) =>
  buildSchema('SERVICE_UNAVAILABLE', 'Service Unavailable', args);
