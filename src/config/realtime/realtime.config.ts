import { registerAs } from '@nestjs/config';

/**
 * Registers the `realtime` config namespace consumed by {@link RealtimeConfigService}.
 *
 * @returns The allowed Socket.IO client origin read from `CLIENT_SOCKET_URL`.
 */
export const realtimeConfig = registerAs('realtime', () => ({
  clientSocketUrl: process.env.CLIENT_SOCKET_URL,
}));
