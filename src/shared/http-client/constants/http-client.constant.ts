/**
 * NestJS injection token for the {@link HttpClientOptions} configuration object.
 *
 * Provided by {@link HttpClientModule.forRoot} / {@link HttpClientModule.forRootAsync}
 * and consumed by {@link HttpClientService} via `@Inject(HTTP_CLIENT_OPTIONS)`.
 */
export const HTTP_CLIENT_OPTIONS = 'HTTP_CLIENT_OPTIONS' as const;
