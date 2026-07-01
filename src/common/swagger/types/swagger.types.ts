import { HttpMethod } from '../enums';

/** Keys of `HTTP_STATUS` supported by the error response builders. */
export type StatusKey =
  | 'BAD_REQUEST'
  | 'PAYMENT_REQUIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'REQUEST_TIMEOUT'
  | 'CONFLICT'
  | 'GONE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT';

/** Single named example entry within a multi-example Swagger error response. */
export type ExampleItem = {
  summary?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  data?: unknown;
};

/** Arguments for an error response documented with a single example. */
export type SingleExampleArgs = {
  path: string;
  method: HttpMethod;
  message?: string;
  data?: unknown;
  errors?: ExampleItem['errors'];
};

/** Arguments for an error response documented with multiple named examples. */
export type MultipleExamplesArgs = {
  path: string;
  method: HttpMethod;
  examples: Record<string, ExampleItem>;
};

/** Arguments accepted by `buildErrorSchema` and the pre-bound `*Response` helpers. */
export type ResponseArgs = SingleExampleArgs | MultipleExamplesArgs;
