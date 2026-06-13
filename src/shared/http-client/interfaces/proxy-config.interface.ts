/**
 * Configuration for routing HTTP requests through a proxy server.
 *
 * Pass an instance of this interface in the `proxy` field of an Axios request
 * config to forward requests via the specified host and port.
 */
export interface ProxyConfig {
  /** Proxy server hostname or IP address. */
  host: string;
  /** Proxy server port number. */
  port: number;
  /** Credentials for proxy servers that require basic authentication. */
  auth: {
    /** Proxy username. */
    username: string;
    /** Proxy password. */
    password: string;
  };
}
