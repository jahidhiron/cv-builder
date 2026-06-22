import { HttpMethod } from '../enums';

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

export type ExampleItem = {
  summary?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  data?: unknown;
};

export type SingleExampleArgs = {
  path: string;
  method: HttpMethod;
  message?: string;
  data?: unknown;
  errors?: ExampleItem['errors'];
};

export type MultipleExamplesArgs = {
  path: string;
  method: HttpMethod;
  examples: Record<string, ExampleItem>;
};

export type ResponseArgs = SingleExampleArgs | MultipleExamplesArgs;
