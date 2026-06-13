/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConfigService } from '@/config';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { AppSocket, SocketServer } from '../types';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      cors: { origin: this.configService.realtime.clientSocketUrl },
      ...options,
    }) as SocketServer;

    server.of('/realtime').use(this.jwtWsMiddleware());

    return server;
  }

  private jwtWsMiddleware() {
    return (client: AppSocket, next: (err?: Error) => void) => {
      try {
        const authHeader = client.handshake.headers?.authorization;
        // You can validate JWT here and attach user to client.data.user
        client.data.user = { id: 1, name: 'Jahid Hiron' }; // dummy user
        return next();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'invalid token';
        return next(new Error(`Unauthorized: ${msg}`));
      }
    };
  }
}
