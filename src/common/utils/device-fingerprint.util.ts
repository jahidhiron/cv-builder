import { clientAgent, clientIp } from '@/common/filters';
import type { Request } from 'express';

/**
 * Generates a stable, short device fingerprint from the incoming request.
 *
 * Combines the client IP (via {@link clientIp}, which honours `x-forwarded-for`
 * when `trust proxy` is set) and the {@link clientAgent} header, then
 * base64-encodes the result and trims it to 64 characters.
 *
 * Used to group refresh tokens into a "family" per device so the auth flow
 * can revoke every session from the same device atomically.
 */
export function getDeviceFingerprint(request: Request): string {
  const ip = clientIp(request);
  const ua = clientAgent(request);
  return Buffer.from(`${ip}|${ua}`).toString('base64').slice(0, 64);
}
