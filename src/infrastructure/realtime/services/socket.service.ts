import { AppLogger } from '@/config/logger';
import { ServerToClientEvents } from '@/infrastructure/realtime/interfaces';
import type { AppNamespace } from '@/infrastructure/realtime/types';
import { Injectable } from '@nestjs/common';

/**
 * Injectable service for broadcasting Socket.IO events from outside the gateway.
 *
 * The gateway calls {@link setNamespace} once during its `afterInit` lifecycle hook,
 * making the namespace available to any service or controller that injects `SocketService`.
 * All emit methods are no-ops when the namespace has not been set yet (e.g. during tests
 * or before the WebSocket server has started).
 */
@Injectable()
export class SocketService {
  private nsp?: AppNamespace;

  constructor(private readonly logger: AppLogger) {}

  /**
   * Stores the `/realtime` namespace reference injected by the gateway.
   * Must be called before any `emit*` method.
   *
   * @param nsp - The Socket.IO namespace for the `/realtime` path.
   */
  setNamespace(nsp: AppNamespace): void {
    this.nsp = nsp;
  }

  /**
   * Emits a typed event to every connected client in the namespace.
   * Silently returns when the namespace is not yet set.
   *
   * @param event - Event name from {@link ServerToClientEvents}.
   * @param args  - Payload matching the event's parameter signature.
   */
  emitToAll<Event extends keyof ServerToClientEvents>(
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void {
    if (!this.nsp) return;
    this.logger.debug(`Emitting '${event}' to all clients`, SocketService.name);
    this.nsp.emit(event, ...args);
  }

  /**
   * Emits a typed event to a single connected client identified by socket ID.
   * Silently returns when the client is not found in the namespace.
   *
   * @param clientId - Socket ID of the target client.
   * @param event    - Event name from {@link ServerToClientEvents}.
   * @param args     - Payload matching the event's parameter signature.
   */
  emitToClient<Event extends keyof ServerToClientEvents>(
    clientId: string,
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void {
    const client = this.nsp?.sockets.get(clientId);
    if (!client) return;
    this.logger.debug(`Emitting '${event}' to client ${clientId}`, SocketService.name);
    client.emit(event, ...args);
  }
}
