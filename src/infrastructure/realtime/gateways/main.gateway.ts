import { AppLogger } from '@/config/logger';
import { SocketService } from '@/infrastructure/realtime/services';
import type { AppNamespace } from '@/infrastructure/realtime/types';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * Primary WebSocket gateway for the `/realtime` namespace.
 *
 * Responsibilities:
 * - Injects the initialised namespace into {@link SocketService} so that
 *   non-gateway code can emit events.
 * - Sends a `connect_ack` welcome event on every new connection.
 * - Logs client connect and disconnect events at `debug` level.
 *
 * JWT validation for incoming connections is delegated to the Socket.IO
 * middleware registered in {@link SocketIoAdapter}.
 */
@WebSocketGateway({ namespace: '/realtime' })
export class MainGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: AppNamespace;

  constructor(
    private readonly socketService: SocketService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Called by NestJS after the Socket.IO server is initialised.
   * Registers connection and message handlers on the namespace.
   *
   * @param nsp - The `/realtime` Socket.IO namespace.
   */
  afterInit(nsp: AppNamespace): void {
    this.logger.log('WebSocket gateway initialized (namespace /realtime)', MainGateway.name);
    this.socketService.setNamespace(nsp);

    nsp.on('connection', (socket: Socket) => {
      socket.emit('connect_ack', {
        message: 'Welcome! Connection established.',
        at: new Date().toISOString(),
      });

      socket.on('connect_ack', (payload: { name: string; timestamp: string }) => {
        this.logger.debug(
          `Ack from ${socket.id} — name: ${payload.name}, at: ${payload.timestamp}`,
          MainGateway.name,
        );
      });

      socket.on('disconnect', () => {
        this.logger.debug(`Client disconnected: ${socket.id}`, MainGateway.name);
      });
    });
  }
}
