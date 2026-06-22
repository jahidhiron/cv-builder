/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HTTP_STATUS } from './constants';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { I18nService } from 'nestjs-i18n';
import { AppResponse } from './interfaces';
import { ResponseParams } from './types';

/**
 * Core request-scoped service that assembles {@link AppResponse} envelopes.
 *
 * Consumed internally by {@link SuccessResponse} and {@link ErrorResponse}.
 * Feature modules should not inject this service directly â€” use the typed helpers instead.
 *
 * Being request-scoped ensures that `method`, `path`, and the resolved i18n language
 * are always derived from the current HTTP request.
 */
@Injectable({ scope: Scope.REQUEST })
export class ResponseService {
  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Determine the preferred language from request headers.
   *
   * Checks `x-language`, `accept-language`, and `content-language` (in that
   * order). Falls back to `"en"` when none of the headers are present or parseable.
   *
   * @returns BCP 47 language tag (e.g. `"en"`, `"fr"`, `"ar"`).
   */
  private getLangFromRequest(): string {
    const headerKeys = ['x-language', 'accept-language', 'content-language'];

    for (const key of headerKeys) {
      const headerValue = this.request.headers[key.toLowerCase()];

      if (!headerValue) {
        continue;
      }

      if (Array.isArray(headerValue)) {
        if (headerValue.length > 0) {
          return headerValue[0];
        }
      } else if (typeof headerValue === 'string' && headerValue.trim()) {
        if (key === 'accept-language') {
          const langs = headerValue.split(',').map((l) => l.trim());
          if (langs.length) {
            return langs[0];
          }
        } else {
          return headerValue.trim();
        }
      }
    }

    return 'en';
  }

  /**
   * Assemble a typed {@link AppResponse} from its constituent parts.
   *
   * Spreads non-empty, non-array `rest` objects into `data`. The HTTP status code
   * is sourced from the `HTTP_STATUS` map; unknown keys fall back to `200`/`500`.
   *
   * @param success - Whether this is a success or error response.
   * @param status  - Key from the `HTTP_STATUS` map (e.g. `"OK"`, `"NOT_FOUND"`).
   * @param message - Resolved message string.
   * @param rest    - Optional additional payload spread into `data`.
   */
  private buildResponse<T extends object = any>(
    success: boolean,
    status: keyof typeof HTTP_STATUS,
    message: string,
    rest?: T,
  ): AppResponse<T> {
    const { method, path: reqPath } = this.request;
    const statusCode = HTTP_STATUS[status]?.status || (success ? 200 : 500);
    const statusText = HTTP_STATUS[status]?.context || (success ? 'HTTP_SUCCESS' : 'HTTP_ERROR');

    const response: AppResponse<T> = {
      method,
      success,
      status: statusText,
      statusCode,
      path: reqPath,
      timestamp: new Date().toISOString(),
      message,
    };

    if (rest && typeof rest === 'object' && Object.keys(rest).length > 0 && !Array.isArray(rest)) {
      response.data = { ...rest };
    }

    return response;
  }

  /**
   * Build a success {@link AppResponse}.
   *
   * Resolves the message from the i18n catalogue using `<module>.success.<key>`,
   * or uses `params.message` directly when provided.
   *
   * @param status - HTTP status key (e.g. `"OK"`, `"CREATED"`).
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Populated success envelope.
   */
  async success<T extends object = any>(
    status: keyof typeof HTTP_STATUS,
    params: ResponseParams,
  ): Promise<AppResponse<T>> {
    const { module, key, message: directMessage, args, ...rest } = params;

    let message: string;

    if (directMessage) {
      message = directMessage;
    } else {
      const msgKey = `${module}.success.${key}`;
      message = await this.i18n.translate(msgKey, {
        lang: this.getLangFromRequest(),
        args,
      });
    }

    return this.buildResponse<T>(true, status, message, rest as T);
  }

  /**
   * Build an error {@link AppResponse}.
   *
   * Resolves the message from the i18n catalogue using `<module>.error.<key>`,
   * or uses `params.message` directly when provided.
   *
   * @param status - HTTP status key (e.g. `"BAD_REQUEST"`, `"NOT_FOUND"`).
   * @param params - i18n keys or direct message, plus optional payload fields.
   * @returns Populated error envelope (to be wrapped in an `HttpException`).
   */
  async error<T extends object = any>(
    status: keyof typeof HTTP_STATUS,
    params: ResponseParams,
  ): Promise<AppResponse<T>> {
    const { module, key, message: directMessage, args, ...rest } = params;

    let message: string;
    if (module && key) {
      message = await this.i18n.translate(`${module}.error.${key}`, {
        lang: this.getLangFromRequest(),
        args,
      });
    } else {
      message = directMessage ?? 'Error';
    }

    return this.buildResponse<T>(false, status, message, rest as T);
  }
}
