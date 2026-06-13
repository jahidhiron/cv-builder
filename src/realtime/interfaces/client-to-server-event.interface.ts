export interface ClientToServerEvents {
  connect_ack: (data: { name: string; timestamp: string }) => void;
}
