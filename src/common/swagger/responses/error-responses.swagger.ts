import { buildErrorSchema } from '../builders';
import { ResponseArgs } from '../types';

/**
 * Pre-bound Swagger response decorators for every HTTP error status.
 *
 * Each export is a thin wrapper around `buildErrorSchema` that fixes the
 * `statusKey` and `description` so call-sites only need to supply `ResponseArgs`
 * (path, method, and optionally errors / examples).
 *
 */
/**
 * Documents a 400 Bad Request response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const BadRequestResponse = (args: ResponseArgs) =>
  buildErrorSchema('BAD_REQUEST', 'Bad Request', args);

/**
 * Documents a 402 Payment Required response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const PaymentRequiredResponse = (args: ResponseArgs) =>
  buildErrorSchema('PAYMENT_REQUIRED', 'Payment Required', args);

/**
 * Documents a 401 Unauthorized response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const UnauthorizedResponse = (args: ResponseArgs) =>
  buildErrorSchema('UNAUTHORIZED', 'Unauthorized', args);

/**
 * Documents a 403 Forbidden response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const ForbiddenResponse = (args: ResponseArgs) =>
  buildErrorSchema('FORBIDDEN', 'Forbidden', args);

/**
 * Documents a 404 Not Found response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const NotFoundResponse = (args: ResponseArgs) =>
  buildErrorSchema('NOT_FOUND', 'Not Found', args);

/**
 * Documents a 408 Request Timeout response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const RequestTimeoutResponse = (args: ResponseArgs) =>
  buildErrorSchema('REQUEST_TIMEOUT', 'Request Timeout', args);

/**
 * Documents a 409 Conflict response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const ConflictResponse = (args: ResponseArgs) =>
  buildErrorSchema('CONFLICT', 'Conflict', args);

/**
 * Documents a 410 Gone response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const GoneResponse = (args: ResponseArgs) =>
  buildErrorSchema('GONE', 'Gone', args);

/**
 * Documents a 422 Unprocessable Entity response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const UnprocessableEntityResponse = (args: ResponseArgs) =>
  buildErrorSchema('UNPROCESSABLE_ENTITY', 'Unprocessable Entity', args);

/**
 * Documents a 429 Too Many Requests response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const TooManyRequestsResponse = (args: ResponseArgs) =>
  buildErrorSchema('TOO_MANY_REQUESTS', 'Too Many Requests', args);

/**
 * Documents a 500 Internal Server Error response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const InternalServerErrorResponse = (args: ResponseArgs) =>
  buildErrorSchema('INTERNAL_SERVER_ERROR', 'Internal Server Error', args);

/**
 * Documents a 501 Not Implemented response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const NotImplementedResponse = (args: ResponseArgs) =>
  buildErrorSchema('NOT_IMPLEMENTED', 'Not Implemented', args);

/**
 * Documents a 502 Bad Gateway response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const BadGatewayResponse = (args: ResponseArgs) =>
  buildErrorSchema('BAD_GATEWAY', 'Bad Gateway', args);

/**
 * Documents a 503 Service Unavailable response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const ServiceUnavailableResponse = (args: ResponseArgs) =>
  buildErrorSchema('SERVICE_UNAVAILABLE', 'Service Unavailable', args);

/**
 * Documents a 504 Gateway Timeout response.
 *
 * @param args - Path, method, and optional error list/examples.
 */
export const GatewayTimeoutResponse = (args: ResponseArgs) =>
  buildErrorSchema('GATEWAY_TIMEOUT', 'Gateway Timeout', args);
