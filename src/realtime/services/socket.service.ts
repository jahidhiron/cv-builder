import { AppLogger } from '@/config/logger';
import { ServerToClientEvents } from '@/realtime/interfaces';
import { Injectable } from '@nestjs/common';
import { Namespace } from 'socket.io';

@Injectable()
export class SocketService {
  private nsp: Namespace;

  constructor(private readonly logger: AppLogger) {}

  setNamespace(nsp: Namespace) {
    this.nsp = nsp;
  }

  emitToAll<Event extends keyof ServerToClientEvents>(
    event: Event,
    data: Parameters<ServerToClientEvents[Event]>[0],
  ) {
    if (!this.nsp) return;
    this.logger.log(`Emitting event '${event}' to all clients`);
    this.nsp.emit(event, data);
  }

  emitToClient<Event extends keyof ServerToClientEvents>(
    clientId: string,
    event: Event,
    data: Parameters<ServerToClientEvents[Event]>[0],
  ) {
    const client = this.nsp?.sockets.get(clientId);
    if (client) client.emit(event, data);
  }
}
