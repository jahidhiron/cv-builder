/**
 * Events that clients can emit to the server on the `/realtime` namespace.
 *
 * Add new events here when implementing server-side listeners. Each event
 * handler must be wired up in `MainGateway.afterInit`.
 */
export interface ClientToServerEvents {
  /** Acknowledgement message sent by the client after receiving the server's welcome event. */
  connect_ack: (data: { name: string; timestamp: string }) => void;
}

/**
 * Events that the server can emit to clients on the `/realtime` namespace.
 *
 * Add new events here to extend the server-push surface. Keep payloads
 * serialisable (no class instances, no circular refs).
 */
export interface ServerToClientEvents {
  /** Welcome event emitted immediately after a client connects. */
  connect_ack: (data: { message: string; at: string }) => void;
}

/**
 * Inter-server events (used by Socket.IO cluster adapters).
 * Not used in this application — kept as an empty type to satisfy the generic parameter.
 */
export type InterServerEvents = Record<string, never>;
