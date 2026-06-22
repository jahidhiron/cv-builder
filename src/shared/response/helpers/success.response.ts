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
 * on the Express response automatically â€” no `@HttpCode()` decorator required
 * on controller methods.
 *
 * @example
 * ```ts
 * @Post('signup')
 * async signup(@Body() dto: SignupDto) {
 *   const user = await this.authService.signup(dto);
 *   return this.successResponse.created({ module: 'auth', key: 'signup', user });
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class SuccessResponse {
  constructor(private readonly responseService: ResponseService) {}

  /**
   * 200 OK â€” general-purpose success response.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  ok<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.OK.context, params);
  }

  /**
   * 201 Created â€” resource was successfully created.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  created<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.CREATED.context, params);
  }

  /**
   * 202 Accepted â€” request has been accepted for asynchronous processing.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  accepted<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.ACCEPTED.context, params);
  }

  /**
   * 204 No Content â€” operation succeeded but the response carries no body.
   *
   * @param params - i18n keys or direct message.
   */
  noContent<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.NO_CONTENT.context, params);
  }

  /**
   * 206 Partial Content â€” response contains a partial representation of the resource.
   *
   * Typically used for range requests or paginated streaming responses.
   *
   * @param params - i18n keys or direct message, plus optional payload fields.
   */
  partialContent<T extends object = any>(params: ResponseParams<T>): Promise<AppResponse<T>> {
    return this.responseService.success<T>(HTTP_STATUS.PARTIAL_CONTENT.context, params);
  }
}
