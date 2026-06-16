import type { Request } from 'express';

/**
 * Generates a stable, short device fingerprint from the incoming request.
 * Combines the client IP (honouring `x-forwarded-for`) and `User-Agent`
 * header, then base64-encodes the result and trims it to 64 characters.
 *
 * Used to group refresh tokens into a "family" per device.
 */
export function getDeviceFingerprint(request: Request): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  const ip =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ??
    request.socket?.remoteAddress ??
    '';
  const ua = request.headers['user-agent'] ?? '';
  return Buffer.from(`${ip}|${ua}`).toString('base64').slice(0, 64);
}
