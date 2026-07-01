import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { HTTP_CLIENT_OPTIONS } from './constants';
import { HttpClientService } from './http.service';
import { HttpClientAsyncOptions } from './interfaces';

/**
 * Provides `HttpClientService` with optional global configuration.
 *
 * Usage:
 * - Plain import: `HttpClientModule` — uses built-in defaults.
 * - Sync config:  `HttpClientModule.forRoot({ timeout: 5000, retry: { count: 2 } })`
 * - Async config: `HttpClientModule.forRootAsync({ useFactory: (cfg) => ({ baseURL: cfg.apiUrl }), inject: [ConfigService] })`
 */
@Module({
  imports: [HttpModule],
  providers: [{ provide: HTTP_CLIENT_OPTIONS, useValue: {} }, HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {
  /**
   * Configure the module synchronously.
   *
   * @param options - Static configuration applied to every request made by `HttpClientService`.
   *   Pass an `HttpClientOptions`-shaped object for full type-checking at the call site.
   * @returns A `DynamicModule` providing `HttpClientService` with the given options.
   */
  static forRoot(options: object = {}): DynamicModule {
    return {
      module: HttpClientModule,
      imports: [HttpModule],
      providers: [{ provide: HTTP_CLIENT_OPTIONS, useValue: options }, HttpClientService],
      exports: [HttpClientService],
    };
  }

  /**
   * Configure the module asynchronously, e.g. from `ConfigService`.
   *
   * @param asyncOptions - `useFactory`/`inject`/`imports` describing how to build the options object.
   * @returns A `DynamicModule` providing `HttpClientService` with the resolved options.
   */
  static forRootAsync(asyncOptions: HttpClientAsyncOptions): DynamicModule {
    return {
      module: HttpClientModule,
      imports: [...(asyncOptions.imports ?? []), HttpModule],
      providers: [
        {
          provide: HTTP_CLIENT_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject ?? [],
        },
        HttpClientService,
      ],
      exports: [HttpClientService],
    };
  }
}
