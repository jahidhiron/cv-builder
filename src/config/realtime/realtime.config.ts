import { registerAs } from '@nestjs/config';

export const realtimeConfig = registerAs('realtime', () => ({
  clientSocketUrl: process.env.CLIENT_SOCKET_URL,
}));
