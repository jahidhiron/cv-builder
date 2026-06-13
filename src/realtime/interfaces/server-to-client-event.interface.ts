export interface ServerToClientEvents {
  connect_ack: (data: { message: string; at: string }) => void;
}
