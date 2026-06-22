import { ConfigService } from '@/config';
import { AppSocket, SocketServer } from '@/infrastructure/realtime/types';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Custom Socket.IO adapter that configures CORS and attaches the JWT middleware
 * to the `/realtime` namespace.
 *
 * Extends NestJS `IoAdapter` and overrides `createIOServer` so that the
 * allowed origin is read from `ConfigService.realtime.clientSocketUrl` rather
 * than hardcoded. The JWT middleware is a stub that currently passes all
 * connections through — replace the TODO block with real token validation.
 */
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  /**
   * Creates the typed `SocketServer`, applies the configured CORS origin, and
   * registers the JWT middleware on the `/realtime` namespace.
   *
   * @param port    - TCP port the Socket.IO server binds to.
   * @param options - Base server options forwarded from NestJS.
   * @returns The configured typed `SocketServer`.
   */
  override createIOServer(port: number, options?: ServerOptions): SocketServer {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.configService.realtime.clientSocketUrl },
    }) as SocketServer;

    server.of('/realtime').use(this.jwtWsMiddleware());

    return server;
  }

  /**
   * Returns a Socket.IO middleware function that validates JWT tokens on upgrade.
   * Currently a pass-through stub — add token verification logic in the TODO block.
   */
  private jwtWsMiddleware() {
    return (client: AppSocket, next: (err?: Error) => void) => {
      try {
        // TODO: validate client.handshake.headers.authorization and attach decoded payload to client.data.user
        return next();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Invalid token';
        return next(new Error(`Unauthorized: ${msg}`));
      }
    };
  }
}
