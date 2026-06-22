import type { Namespace, Server, Socket } from 'socket.io';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents } from '@/infrastructure/realtime/interfaces';

/** Typed Socket.IO socket for connections to the `/realtime` namespace. */
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;

/** Typed Socket.IO server instance for the application. */
export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;

/** Typed Socket.IO namespace handle for `/realtime`. Injected into `SocketService` by `MainGateway`. */
export type AppNamespace = Namespace<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;
