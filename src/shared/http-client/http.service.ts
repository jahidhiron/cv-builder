import { ModuleName } from '@/common/base';
import { SystemLog } from '@/modules/activity-log/decorators';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { Observable, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { HTTP_CLIENT_OPTIONS } from './constants';
import { HttpResponse } from './interfaces';

/**
 * A thin, opinionated wrapper around `@nestjs/axios` `HttpService`.
 *
 * Features:
 * - Uniform `HttpResponse<T>` shape across all methods (success and error).
 * - Automatic retry with configurable count and delay (see `HttpClientOptions`).
 * - Global defaults for baseURL, timeout, and headers applied once at startup.
 * - All errors are caught and surfaced as a failed `HttpResponse` — never thrown.
 */
@Injectable()
export class HttpClientService {
  private readonly retryCount: number;
  private readonly retryDelay: number;
  private readonly baseURL: string | undefined;
  private readonly httpTimeout: number | undefined;
  private readonly defaultHeaders: Record<string, string> | undefined;

  /**
   * @param httpService - Underlying `@nestjs/axios` `HttpService` whose shared axios instance is configured.
   * @param options - Raw injected `HTTP_CLIENT_OPTIONS` value; narrowed and defaulted internally since its
   *                  shape is only guaranteed at the `HttpClientOptions` type level for callers.
   */
  constructor(
    private readonly httpService: HttpService,
    @Inject(HTTP_CLIENT_OPTIONS) options: unknown,
  ) {
    const opts =
      typeof options === 'object' && options !== null ? (options as Record<string, unknown>) : {};

    const retryOpts =
      typeof opts['retry'] === 'object' && opts['retry'] !== null
        ? (opts['retry'] as Record<string, unknown>)
        : {};

    const retryCount = retryOpts['count'];
    const retryDelay = retryOpts['delay'];
    this.retryCount = typeof retryCount === 'number' ? retryCount : 3;
    this.retryDelay = typeof retryDelay === 'number' ? retryDelay : 1000;
    this.baseURL = typeof opts['baseURL'] === 'string' ? opts['baseURL'] : undefined;
    this.httpTimeout = typeof opts['timeout'] === 'number' ? opts['timeout'] : undefined;
    this.defaultHeaders =
      typeof opts['defaultHeaders'] === 'object' && opts['defaultHeaders'] !== null
        ? (opts['defaultHeaders'] as Record<string, string>)
        : undefined;
    this.applyDefaults();
    this.setupInterceptors();
  }

  /**
   * Applies global axios defaults (baseURL, timeout, headers) from the injected options.
   * Runs once during service construction.
   */
  private applyDefaults(): void {
    if (this.baseURL) this.httpService.axiosRef.defaults.baseURL = this.baseURL;
    if (this.httpTimeout) this.httpService.axiosRef.defaults.timeout = this.httpTimeout;

    if (this.defaultHeaders) {
      for (const [key, value] of Object.entries(this.defaultHeaders)) {
        this.httpService.axiosRef.defaults.headers.common[key] = value;
      }
    }
  }

  /**
   * Registers request and response interceptors on the shared axios instance.
   * Ensures headers are always initialised and errors are always `Error` instances.
   */
  private setupInterceptors(): void {
    this.httpService.axiosRef.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (!config.headers) config.headers = new AxiosHeaders();
        return config;
      },
      (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error))),
    );

    this.httpService.axiosRef.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: unknown) => Promise.reject(error instanceof Error ? error : new Error(String(error))),
    );
  }

  private isAxiosError<T>(error: unknown): error is AxiosError<T> {
    return (error as AxiosError).isAxiosError === true;
  }

  /**
   * Pipes an axios observable through retry logic and maps it to a uniform `HttpResponse<T>`.
   * Errors are caught and returned as a failed response instead of propagating.
   */
  private handleRequest<T>(request: Observable<AxiosResponse<T>>): Observable<HttpResponse<T>> {
    return request.pipe(
      retry({ count: this.retryCount, delay: this.retryDelay }),
      map(
        (response: AxiosResponse<T>): HttpResponse<T> => ({
          data: response.data,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          message: response.statusText || 'OK',
          headers: response.headers as Record<string, any>,
        }),
      ),
      catchError((error: unknown): Observable<HttpResponse<T>> => {
        let status = 0;
        let message = 'Unknown error';
        let errorMessage = '';

        if (this.isAxiosError(error)) {
          if (error.response) {
            status = error.response.status;
            message = error.response.statusText || 'HTTP error';
            errorMessage = error.message;
          } else if (error.request) {
            message = 'No response received';
            errorMessage = error.message;
          } else if (error.code === 'ENOTFOUND') {
            status = -1;
            message = 'DNS lookup failed';
            errorMessage = error.message;
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = (error as Error).message || 'Unknown error';
        }

        return of({ data: null, status, success: false, message, error: errorMessage });
      }),
    );
  }

  /**
   * Sends a GET request.
   *
   * @param url - Target URL (relative to `baseURL` when configured).
   * @param config - Optional Axios request config (headers, params, etc.).
   * @returns Observable that emits a single `HttpResponse<T>`.
   */
  @SystemLog(ModuleName.Shared)
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.get<T>(url, config));
  }

  /**
   * Sends a POST request.
   *
   * @param url - Target URL.
   * @param data - Request body.
   * @param config - Optional Axios request config.
   * @returns Observable that emits a single `HttpResponse<T>`.
   */
  @SystemLog(ModuleName.Shared)
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.post<T>(url, data, config));
  }

  /**
   * Sends a PUT request (full resource replacement).
   *
   * @param url - Target URL.
   * @param data - Request body.
   * @param config - Optional Axios request config.
   * @returns Observable that emits a single `HttpResponse<T>`.
   */
  @SystemLog(ModuleName.Shared)
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.put<T>(url, data, config));
  }

  /**
   * Sends a PATCH request (partial resource update).
   *
   * @param url - Target URL.
   * @param data - Partial request body.
   * @param config - Optional Axios request config.
   * @returns Observable that emits a single `HttpResponse<T>`.
   */
  @SystemLog(ModuleName.Shared)
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.patch<T>(url, data, config));
  }

  /**
   * Sends a DELETE request.
   *
   * @param url - Target URL.
   * @param config - Optional Axios request config.
   * @returns Observable that emits a single `HttpResponse<T>`.
   */
  @SystemLog(ModuleName.Shared)
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.delete<T>(url, config));
  }

  /**
   * Sends a HEAD request.
   * Useful for checking resource existence or reading response headers without a body.
   *
   * @param url - Target URL.
   * @param config - Optional Axios request config.
   * @returns Observable that emits a single `HttpResponse<T>` (data will always be null).
   */
  @SystemLog(ModuleName.Shared)
  head<T = unknown>(url: string, config?: AxiosRequestConfig): Observable<HttpResponse<T>> {
    return this.handleRequest(this.httpService.head<T>(url, config));
  }
}
