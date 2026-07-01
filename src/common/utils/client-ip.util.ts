import { IncomingHttpHeaders } from 'http';

/**
 * Extracts the real client IP address from an HTTP request.
 *
 * Relies on Express `req.ip`, which correctly resolves `X-Forwarded-For` when
 * `trust proxy` is configured in bootstrap. Reading the header directly is
 * intentionally avoided — without trust-proxy, a client can forge any IP value
 * by injecting their own `X-Forwarded-For` header.
 *
 * Resolution order:
 * 1. Express `req.ip` (unwrapped from `X-Forwarded-For` when `trust proxy` is set).
 * 2. Raw TCP `remoteAddress` from the socket.
 * 3. Fallback string `"unknown"` when nothing is available.
 *
 * @param req     - Any request-like object exposing `ip` or `connection.remoteAddress`.
 * @returns The resolved IP string, or `"unknown"` when no address is available.
 */
export function clientIp<
  T extends {
    headers?: IncomingHttpHeaders;
    ip?: string;
    connection?: { remoteAddress?: string };
  },
>(req: T): string {
  return (
    req.ip ??
    req.connection?.remoteAddress ??
    'unknown'
  );
}
