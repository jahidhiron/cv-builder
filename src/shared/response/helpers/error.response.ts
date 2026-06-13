import { HTTP_STATUS } from '@/common/constants';
import { HttpException, Injectable, Scope } from '@nestjs/common';
import { ResponseService } from '../response.service';
import { ResponseParams } from '../types';

/**
 * Request-scoped helper that throws typed `HttpException`s for every common
 * 4xx and 5xx HTTP error status.
 *
 * Each method builds a standardised {@link AppResponse} error envelope via
 * {@link ResponseService}, wraps it in an `HttpException`, and throws — so the
 * return type is always `Promise<never>`. NestJS's global exception filter
 * serialises the envelope to JSON and sets the correct HTTP status code.
 *
 * @example
 * ```ts
 * const user = await this.userRepo.findById(id);
 * if (!user) await this.errorResponse.notFound({ module: 'users', key: 'not-found' });
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class ErrorResponse {
  constructor(private readonly responseService: ResponseService) {}

  /**
   * 400 Bad Request — the request is malformed or contains invalid parameters.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async badRequest<T extends object = any>(params: ResponseParams<T>): Promise<never> {
    params.message ||= 'Bad Request';
    const response = await this.responseService.error<T>(HTTP_STATUS.BAD_REQUEST.context, params);
    throw new HttpException(response, HTTP_STATUS.BAD_REQUEST.status);
  }

  /**
   * 402 Payment Required — the request requires payment to proceed.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async paymentRequired<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Payment Required';
    const response = await this.responseService.error<T>(HTTP_STATUS.PAYMENT_REQUIRED.context, params);
    throw new HttpException(response, HTTP_STATUS.PAYMENT_REQUIRED.status);
  }

  /**
   * 401 Unauthorized — missing or invalid authentication credentials.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async unauthorized<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Unauthorized';
    const response = await this.responseService.error<T>(HTTP_STATUS.UNAUTHORIZED.context, params);
    throw new HttpException(response, HTTP_STATUS.UNAUTHORIZED.status);
  }

  /**
   * 403 Forbidden — authenticated but not authorised to perform the action.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async forbidden<T extends object = any>(params: ResponseParams<T>): Promise<never> {
    params.message ||= 'Forbidden';
    const response = await this.responseService.error<T>(HTTP_STATUS.FORBIDDEN.context, params);
    throw new HttpException(response, HTTP_STATUS.FORBIDDEN.status);
  }

  /**
   * 404 Not Found — the requested resource does not exist.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async notFound<T extends object = any>(params: ResponseParams<T>): Promise<never> {
    params.message ||= 'Not Found';
    const response = await this.responseService.error<T>(HTTP_STATUS.NOT_FOUND.context, params);
    throw new HttpException(response, HTTP_STATUS.NOT_FOUND.status);
  }

  /**
   * 410 Gone — the resource existed but has been permanently removed.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async gone<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Gone';
    const response = await this.responseService.error<T>(HTTP_STATUS.GONE.context, params);
    throw new HttpException(response, HTTP_STATUS.GONE.status);
  }

  /**
   * 409 Conflict — the request conflicts with the current state of the resource
   * (e.g. duplicate email address on registration).
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async conflict<T extends object = any>(params: ResponseParams<T>): Promise<never> {
    params.message ||= 'Conflict';
    const response = await this.responseService.error<T>(HTTP_STATUS.CONFLICT.context, params);
    throw new HttpException(response, HTTP_STATUS.CONFLICT.status);
  }

  /**
   * 422 Unprocessable Entity — the request is syntactically valid but semantically
   * incorrect (e.g. validation failures on a well-formed payload).
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async unprocessableEntity<T extends object = any>(params: ResponseParams<T>): Promise<never> {
    params.message ||= 'Unprocessable Entity';
    const response = await this.responseService.error<T>(HTTP_STATUS.UNPROCESSABLE_ENTITY.context, params);
    throw new HttpException(response, HTTP_STATUS.UNPROCESSABLE_ENTITY.status);
  }

  /**
   * 429 Too Many Requests — the client has exceeded the allowed request rate.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async tooManyRequests<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Too Many Requests';
    const response = await this.responseService.error<T>(HTTP_STATUS.TOO_MANY_REQUESTS.context, params);
    throw new HttpException(response, HTTP_STATUS.TOO_MANY_REQUESTS.status);
  }

  /**
   * 408 Request Timeout — the server timed out waiting for the request.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async requestTimeout<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Unable to process your request at the moment, please try later';
    const response = await this.responseService.error<T>(HTTP_STATUS.REQUEST_TIMEOUT.context, params);
    throw new HttpException(response, HTTP_STATUS.REQUEST_TIMEOUT.status);
  }

  /**
   * 500 Internal Server Error — an unexpected condition was encountered.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async internalServerError<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Internal Server Error';
    const response = await this.responseService.error<T>(HTTP_STATUS.INTERNAL_SERVER_ERROR.context, params);
    throw new HttpException(response, HTTP_STATUS.INTERNAL_SERVER_ERROR.status);
  }

  /**
   * 501 Not Implemented — the server does not support the requested functionality.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async notImplemented<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Not Implemented';
    const response = await this.responseService.error<T>(HTTP_STATUS.NOT_IMPLEMENTED.context, params);
    throw new HttpException(response, HTTP_STATUS.NOT_IMPLEMENTED.status);
  }

  /**
   * 502 Bad Gateway — the upstream server returned an invalid response.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async badGateway<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Bad Gateway';
    const response = await this.responseService.error<T>(HTTP_STATUS.BAD_GATEWAY.context, params);
    throw new HttpException(response, HTTP_STATUS.BAD_GATEWAY.status);
  }

  /**
   * 503 Service Unavailable — the server is temporarily unable to handle requests.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async serviceUnavailable<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Service Unavailable. Please try again later.';
    const response = await this.responseService.error<T>(HTTP_STATUS.SERVICE_UNAVAILABLE.context, params);
    throw new HttpException(response, HTTP_STATUS.SERVICE_UNAVAILABLE.status);
  }

  /**
   * 504 Gateway Timeout — the upstream server did not respond in time.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  async gatewayTimeout<T extends object = any>(params: ResponseParams<T> = {} as ResponseParams<T>): Promise<never> {
    params.message ||= 'Gateway Timeout';
    const response = await this.responseService.error<T>(HTTP_STATUS.GATEWAY_TIMEOUT.context, params);
    throw new HttpException(response, HTTP_STATUS.GATEWAY_TIMEOUT.status);
  }
}
