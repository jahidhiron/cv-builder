import { ALLOWED_DOMAINS, ALLOWED_ORIGINS } from './cors.constant';

/**
 * Determines whether an origin is permitted by the CORS policy.
 *
 * Allows requests where the `Origin` header is absent (`undefined`) — these are
 * same-origin or non-browser (server-to-server) requests.
 * Requests with `Origin: null` (sandboxed iframes, local `file://` pages) are
 * explicitly rejected because they cannot be trusted.
 *
 * Otherwise checks (case-insensitive) against:
 * 1. The `ALLOWED_ORIGINS` list.
 * 2. The `API_BASE_URL` environment variable (always implicitly trusted).
 * 3. The `CLIENT_BASE_URL` environment variable (frontend app origin).
 * 4. The `ALLOWED_DOMAINS` suffix list (e.g. `".example.com"` permits all subdomains).
 *
 * @param origin - Value of the `Origin` request header, or `undefined` if absent.
 * @returns `true` when the origin is allowed.
 */
export function isOriginAllowed(origin?: string): boolean {
  if (origin === undefined) return true;

  const normalizedOrigin = origin.toLowerCase();
  const origins = [
    ...ALLOWED_ORIGINS,
    process.env.API_BASE_URL,
    process.env.CLIENT_BASE_URL,
  ].filter(Boolean) as string[];

  if (origins.includes(normalizedOrigin)) return true;
  return ALLOWED_DOMAINS.some((domain) => normalizedOrigin.endsWith(domain));
}
