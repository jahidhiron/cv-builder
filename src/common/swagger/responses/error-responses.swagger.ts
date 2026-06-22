import { buildErrorSchema } from '../builders';
import { ResponseArgs } from '../types';

/**
 * Pre-bound Swagger response decorators for every HTTP error status.
 *
 * Each export is a thin wrapper around `buildErrorSchema` that fixes the
 * `statusKey` and `description` so call-sites only need to supply `ResponseArgs`
 * (path, method, and optionally errors / examples).
 *
 * @example
 * ```ts
 * \@NotFoundResponse({ path: 'users/:id', method: HttpMethod.GET })
 * \@Get(':id')
 * findOne() { ... }
 * ```
 */
export const BadRequestResponse = (args: ResponseArgs) =>
  buildErrorSchema('BAD_REQUEST', 'Bad Request', args);

export const PaymentRequiredResponse = (args: ResponseArgs) =>
  buildErrorSchema('PAYMENT_REQUIRED', 'Payment Required', args);

export const UnauthorizedResponse = (args: ResponseArgs) =>
  buildErrorSchema('UNAUTHORIZED', 'Unauthorized', args);

export const ForbiddenResponse = (args: ResponseArgs) =>
  buildErrorSchema('FORBIDDEN', 'Forbidden', args);

export const NotFoundResponse = (args: ResponseArgs) =>
  buildErrorSchema('NOT_FOUND', 'Not Found', args);

export const RequestTimeoutResponse = (args: ResponseArgs) =>
  buildErrorSchema('REQUEST_TIMEOUT', 'Request Timeout', args);

export const ConflictResponse = (args: ResponseArgs) =>
  buildErrorSchema('CONFLICT', 'Conflict', args);

export const GoneResponse = (args: ResponseArgs) =>
  buildErrorSchema('GONE', 'Gone', args);

export const UnprocessableEntityResponse = (args: ResponseArgs) =>
  buildErrorSchema('UNPROCESSABLE_ENTITY', 'Unprocessable Entity', args);

export const TooManyRequestsResponse = (args: ResponseArgs) =>
  buildErrorSchema('TOO_MANY_REQUESTS', 'Too Many Requests', args);

export const InternalServerErrorResponse = (args: ResponseArgs) =>
  buildErrorSchema('INTERNAL_SERVER_ERROR', 'Internal Server Error', args);

export const NotImplementedResponse = (args: ResponseArgs) =>
  buildErrorSchema('NOT_IMPLEMENTED', 'Not Implemented', args);

export const BadGatewayResponse = (args: ResponseArgs) =>
  buildErrorSchema('BAD_GATEWAY', 'Bad Gateway', args);

export const ServiceUnavailableResponse = (args: ResponseArgs) =>
  buildErrorSchema('SERVICE_UNAVAILABLE', 'Service Unavailable', args);

export const GatewayTimeoutResponse = (args: ResponseArgs) =>
  buildErrorSchema('GATEWAY_TIMEOUT', 'Gateway Timeout', args);
