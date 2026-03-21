import { TunnelClient } from "./types";
import { config } from "../config";

class TunnelManager {

  private tunnels = new Map<string, TunnelClient>();
  private pending = new Map<string, any>();

  register(client: TunnelClient) {
    this.tunnels.set(client.subdomain, client);

    // Set up automatic cleanup on expiration
    if (client.expiresAt) {
      const ttl = client.expiresAt.getTime() - Date.now();
      setTimeout(() => {
        this.remove(client.subdomain);
        console.log(`[TUNNEL] Expired: ${client.subdomain}.sharelive.site`);
      }, ttl);
    }
  }

  remove(subdomain: string) {
    this.tunnels.delete(subdomain);
  }

  get(subdomain: string) {
    const tunnel = this.tunnels.get(subdomain);

    // Check if tunnel has expired
    if (tunnel && tunnel.expiresAt && tunnel.expiresAt.getTime() < Date.now()) {
      this.remove(subdomain);
      return undefined;
    }

    return tunnel;
  }

  // Check rate limit for a specific tunnel
  checkRateLimit(subdomain: string): boolean {
    const tunnel = this.get(subdomain);
    if (!tunnel) return false;

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Reset counter if we're in a new time window
    if (tunnel.lastRequestTime < windowStart) {
      tunnel.requestCount = 0;
      tunnel.lastRequestTime = now;
    }

    tunnel.requestCount++;
    tunnel.lastRequestTime = now;

    // Check if rate limit exceeded
    if (tunnel.requestCount > config.TUNNEL_RATE_LIMIT) {
      return false;
    }

    return true;
  }

  addPending(requestId: string, reply: any) {
    this.pending.set(requestId, reply);

    // ✅ PRO ADDITION: Timeout cleanup (e.g., 30 seconds)
    // If the local CLI doesn't respond in time, close the connection cleanly.
    setTimeout(() => {
      if (this.pending.has(requestId)) {
        const pendingReply = this.pending.get(requestId);

        // Check if Fastify hasn't already sent the response
        if (!pendingReply.sent) {
          pendingReply.code(504).send("Gateway Timeout: Local tunnel did not respond.");
        }

        this.pending.delete(requestId);
      }
    }, 30000); // 30 seconds
  }

  resolvePending(requestId: string, data: any) {
    const reply = this.pending.get(requestId);
    if (!reply) return; // Request timed out or was already resolved

    const headers = { ...(data.headers || {}) };

    // Remove problematic headers
    delete headers["content-length"];
    delete headers["transfer-encoding"];
    delete headers["content-encoding"];
    delete headers["connection"];

    Object.entries(headers).forEach(([key, value]) => {
      if (value !== undefined) {
        reply.header(key, value as string);
      }
    });

    const bodyBuffer = data.body
      ? Buffer.from(data.body, "base64")
      : Buffer.alloc(0);

    reply.code(data.status || 200).send(bodyBuffer);

    this.pending.delete(requestId);
  }

  // Get all active tunnels (for monitoring)
  getActiveTunnels(): TunnelClient[] {
    return Array.from(this.tunnels.values());
  }

  // Get tunnel count
  getTunnelCount(): number {
    return this.tunnels.size;
  }
}

export const tunnelManager = new TunnelManager();
