import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';

/** Retry strategy applied to every request made through `HttpClientService`. */
export interface HttpClientRetryOptions {
  /** Number of retry attempts on transient failure. Default: `3`. */
  count?: number;
  /** Milliseconds to wait between retries. Default: `1000`. */
  delay?: number;
}

/** Static configuration accepted by {@link HttpClientModule.forRoot} / `forRootAsync`. */
export interface HttpClientOptions {
  /** Base URL prepended to every relative request path. */
  baseURL?: string;
  /** Global request timeout in milliseconds. */
  timeout?: number;
  /** Headers merged into every outgoing request. */
  defaultHeaders?: Record<string, string>;
  /** Retry strategy applied to all requests. */
  retry?: HttpClientRetryOptions;
}

/**
 * Options accepted by {@link HttpClientModule.forRootAsync}.
 *
 * Mirrors the NestJS async-options pattern: provide a `useFactory` that
 * receives injected dependencies and returns an {@link HttpClientOptions} object.
 *
 */
export interface HttpClientAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /** Factory function that returns the synchronous or asynchronous configuration object. */
  useFactory: (...args: any[]) => Promise<object> | object;
  /** Providers injected into `useFactory` as positional arguments. */
  inject?: FactoryProvider['inject'];
}
