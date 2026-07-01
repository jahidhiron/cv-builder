/** Envelope values used to render `@ApiProperty` examples on generated response DTOs. */
export interface SwaggerResponseOptions {
  /** HTTP method example, typically an `HttpMethod` enum value. */
  method: string;
  /** Status context string (e.g. `HTTP_STATUS.OK.context`). */
  status: string;
  /** Numeric HTTP status code (e.g. `HTTP_STATUS.OK.status`). */
  statusCode: number;
  /** Human-readable response message shown as the example. */
  message: string;
  /** Route path relative to the global prefix. */
  path: string;
}
