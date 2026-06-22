import { ConfigModule } from '@/config';
import { SharedModule } from '@/shared';
import { MainGateway } from '@/infrastructure/realtime/gateways';
import { SocketService } from '@/infrastructure/realtime/services';
import { Module } from '@nestjs/common';

/**
 * Hosts the WebSocket gateway and `SocketService` for real-time client communication.
 *
 * Exports `SocketService` so other modules (e.g. `RabbitMqModule`) can push
 * events to connected clients without importing the full module.
 */
@Module({
  imports: [ConfigModule, SharedModule],
  providers: [SocketService, MainGateway],
  exports: [SocketService],
})
export class RealtimeModule {}
