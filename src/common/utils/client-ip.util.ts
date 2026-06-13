import { IncomingHttpHeaders } from 'http';

export function clientIp<
  T extends {
    headers?: IncomingHttpHeaders;
    ip?: string;
    connection?: { remoteAddress?: string };
  },
>(req: T): string {
  return (
    req.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() ??
    req.ip ??
    req.connection?.remoteAddress ??
    'unknown'
  );
}
