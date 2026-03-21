import WebSocket from "ws";

export interface TunnelClient {
  id: string;
  subdomain: string;
  socket: WebSocket;
  accessToken?: string; // Optional access token for additional security
  createdAt: Date;
  expiresAt?: Date;
  authenticated: boolean;
  userId?: string;
  requestCount: number;
  lastRequestTime: number;
}
