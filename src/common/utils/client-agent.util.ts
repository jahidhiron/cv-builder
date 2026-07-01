import type { IncomingHttpHeaders } from 'http';

/**
 * Extracts the client user-agent string from an HTTP request.
 *
 * Reads the `User-Agent` header verbatim. Returns an empty string when the
 * header is missing or not a string (e.g. an `array` value when a client
 * sent multiple headers). The result is capped at 512 characters so a
 * malformed client cannot balloon audit-log rows.
 *
 * @param req - Any request-like object exposing Express-style `headers`.
 * @returns The user-agent string, truncated to 512 chars, or `''` when unavailable.
 */
export function clientAgent<
  T extends {
    headers?: IncomingHttpHeaders;
  },
>(req: T): string {
  const ua =
    typeof req.headers?.['user-agent'] === 'string'
      ? req.headers['user-agent']
      : '';

  return ua.length > 512 ? ua.slice(0, 512) : ua;
}
