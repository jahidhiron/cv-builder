import { HTTP_STATUS } from '@/shared/response/constants';
import { Injectable, Scope } from '@nestjs/common';
import { AppResponse } from '../interfaces';
import { ResponseService } from '../response.service';
import { ResponseParams } from '../types';

/**
 * Request-scoped helper that exposes named methods for every 2xx HTTP status.
 *
 * Each method builds and returns an {@link AppResponse} with the correct
 * `statusCode`. {@link ResponseStatusInterceptor} reads that code and sets it
 * on the Express response automatically -- no `@HttpCode()` decorator required
 * on controller methods.
 */
@Injectable({ scope: Scope.REQUEST })
export class SuccessResponse {
  constructor(private readonly responseService: ResponseService) {}

  /**
   * 200 OK -- general-purpose success response.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Resolved {@link AppResponse} envelope with HTTP 200 status.
   */
  ok<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.OK.context, params);
  }

  /**
   * 201 Created -- resource was successfully created.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Resolved {@link AppResponse} envelope with HTTP 201 status.
   */
  created<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.CREATED.context, params);
  }

  /**
   * 202 Accepted -- request has been accepted for asynchronous processing.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Resolved {@link AppResponse} envelope with HTTP 202 status.
   */
  accepted<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.ACCEPTED.context, params);
  }

  /**
   * 204 No Content -- operation succeeded but the response carries no body.
   *
   * @param params - i18n keys or direct message.
   * @returns Resolved {@link AppResponse} envelope with HTTP 204 status.
   */
  noContent<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.NO_CONTENT.context, params);
  }

  /**
   * 206 Partial Content -- response contains a partial representation of the resource.
   *
   * Typically used for range requests or paginated streaming responses.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Resolved {@link AppResponse} envelope with HTTP 206 status.
   */
  partialContent<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.PARTIAL_CONTENT.context, params);
  }
}
