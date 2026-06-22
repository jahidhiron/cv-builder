import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiGatewayTimeoutResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiNotImplementedResponse,
  ApiPaymentRequiredResponse,
  ApiRequestTimeoutResponse,
  ApiResponseOptions,
  ApiServiceUnavailableResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { StatusKey } from '../types';

/** Maps an HTTP status key to its corresponding NestJS Swagger `@Api*Response` decorator. */
export type ApiErrorDecorator = (options: ApiResponseOptions) => MethodDecorator & ClassDecorator;

/** Lookup table that maps every supported {@link StatusKey} to its Swagger decorator. */
export const DECORATOR_MAP: Record<StatusKey, ApiErrorDecorator> = {
  BAD_REQUEST: ApiBadRequestResponse,
  PAYMENT_REQUIRED: ApiPaymentRequiredResponse,
  UNAUTHORIZED: ApiUnauthorizedResponse,
  FORBIDDEN: ApiForbiddenResponse,
  NOT_FOUND: ApiNotFoundResponse,
  REQUEST_TIMEOUT: ApiRequestTimeoutResponse,
  CONFLICT: ApiConflictResponse,
  GONE: ApiGoneResponse,
  UNPROCESSABLE_ENTITY: ApiUnprocessableEntityResponse,
  TOO_MANY_REQUESTS: ApiTooManyRequestsResponse,
  INTERNAL_SERVER_ERROR: ApiInternalServerErrorResponse,
  NOT_IMPLEMENTED: ApiNotImplementedResponse,
  BAD_GATEWAY: ApiBadGatewayResponse,
  SERVICE_UNAVAILABLE: ApiServiceUnavailableResponse,
  GATEWAY_TIMEOUT: ApiGatewayTimeoutResponse,
};
