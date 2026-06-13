export interface RabbitMqQueueApiResponse {
  name: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;

  // Optional throughput metrics
  message_stats?: {
    publish_details?: { rate: number };
    deliver_get_details?: { rate: number };
    ack_details?: { rate: number };
  };

  // Optional memory usage
  memory?: number;

  // Queue configuration / metadata
  durable?: boolean;
  exclusive?: boolean;
  type?: string;
  idle_since?: string; // ISO date string

  // Arguments, e.g., dead-letter exchange/routing
  arguments?: {
    'x-dead-letter-exchange'?: string;
    'x-dead-letter-routing-key'?: string;
    [key: string]: any; // catch-all for other optional arguments
  };
}
