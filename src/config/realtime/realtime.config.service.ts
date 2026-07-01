import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor for the `realtime.*` namespace registered by `realtime.config.ts`.
 *
 * Provides the allowed Socket.IO origin URL used by `SocketIoAdapter` to configure
 * the CORS policy for WebSocket upgrade requests.
 */
@Injectable()
export class RealtimeConfigService {
  /**
   * @param configService - NestJS config service used to read the `realtime.*` namespace.
   */
  constructor(private readonly configService: ConfigService) {}

  /** Allowed client origin for Socket.IO CORS (e.g. `https://app.example.com`). */
  get clientSocketUrl(): string {
    return this.configService.get<string>('realtime.clientSocketUrl')!;
  }
}
