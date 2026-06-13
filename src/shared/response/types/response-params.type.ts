/**
 * Input parameters accepted by {@link SuccessResponse} and {@link ErrorResponse} methods.
 *
 * Two mutually-exclusive shapes are supported:
 *
 * - **i18n-keyed** — supply `module` and `key` to have the message resolved from
 *   the i18n translation catalogue (`<module>.(success|error).<key>`).
 *   Use `args` to inject dynamic values into the translation string.
 * - **Direct message** — supply `message` directly and omit `module`/`key`
 *   to bypass translation entirely.
 *
 * Any additional fields in `T` are spread into {@link AppResponse.data}.
 *
 * @template T - Shape of additional payload fields included in the response body.
 */
export type ResponseParams<T extends object = any> =
  | ({
      /** i18n module name (e.g. `"auth"`, `"users"`). */
      module?: string;
      /** i18n message key within the module (e.g. `"signin"`, `"not-found"`). */
      key?: string;
      /** Direct message string — overrides i18n resolution when provided. */
      message?: string;
      /** Dynamic values injected into the i18n translation string. */
      args?: Record<string, any>;
    } & T)
  | ({
      /** Direct message string — used when `module`/`key` are not applicable. */
      message?: string;
      module?: never;
      key?: never;
      /** Dynamic values (rarely needed without i18n keys). */
      args?: Record<string, any>;
    } & T);
