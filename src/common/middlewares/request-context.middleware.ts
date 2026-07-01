import { ActivityLogContext } from '@/modules/activity-log/context';
import type { RequestContext } from '@/modules/activity-log/context';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Express middleware that opens an `AsyncLocalStorage` scope for the
 * duration of the current HTTP request.
 *
 * Captures: `requestId` (generated or echoed from `X-Request-Id`),
 * `ip` (from `req.ip` — already trusted via `app.set('trust proxy', 1)`),
 * `userAgent`, and `userId` if `req.user` has been populated by an upstream
 * auth guard.
 *
 * Anything called downstream — providers, decorators, fire-and-forget DB
 * writes — sees the same `RequestContext` through `ActivityLogContext.get()`.
 * The `@LogMethod` decorator uses this to attach metadata to its
 * `system_activity_logs` row.
 *
 * @param req - The incoming Express request.
 * @param res - The outgoing Express response; used to echo `X-Request-Id`.
 * @param next - Express callback that continues the middleware chain.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Honour any incoming X-Request-Id so log correlation works across services;
  // otherwise mint a new UUID.
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
      ? incoming
      : randomUUID();

  // Expose the request id on the response so clients (and our own logs) can correlate.
  res.setHeader('X-Request-Id', requestId);

  const userAgentHeader = req.headers['user-agent'];
  const initial: RequestContext = {
    requestId,
    ip: req.ip ?? null,
    userAgent: typeof userAgentHeader === 'string' ? userAgentHeader : null,
    userId: extractUserId(req),
    endpoint: `${req.method} ${req.path}`,
    requestLogId: null,
    pendingSystemLogs: [],
    pendingUserLogs: [],
  };

  ActivityLogContext.run(initial, () => next());
}

/**
 * Pulls `id` from `req.user` if an upstream auth guard has populated it.
 *
 * @param req - The incoming Express request, possibly carrying a `user` payload.
 * @returns The authenticated user's numeric ID, or `null` if unauthenticated or invalid.
 */
function extractUserId(req: Request): number | null {
  const user = (req as Request & { user?: { id?: unknown } }).user;
  if (!user) return null;
  const id = Number(user.id);
  return Number.isFinite(id) ? id : null;
}
