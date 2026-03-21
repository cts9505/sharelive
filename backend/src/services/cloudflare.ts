import { config } from "../config";

interface CnamePayload {
  name: string;
  target: string;
  proxied?: boolean;
  ttl?: number;
}

interface CloudflareResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ message?: string }>;
}

export class CloudflareClient {
  private get isConfigured() {
    return Boolean(config.CLOUDFLARE_API_TOKEN && config.CLOUDFLARE_ZONE_ID);
  }

  private get baseUrl() {
    return `https://api.cloudflare.com/client/v4/zones/${config.CLOUDFLARE_ZONE_ID}`;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${config.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  async createCnameRecord(payload: CnamePayload): Promise<{ id: string }> {
    if (!this.isConfigured) {
      throw new Error("Cloudflare is not configured");
    }

    const response = await fetch(`${this.baseUrl}/dns_records`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        type: "CNAME",
        name: payload.name,
        content: payload.target,
        proxied: payload.proxied ?? false,
        ttl: payload.ttl ?? 300,
      }),
    });

    const data = await response.json() as CloudflareResponse<{ id: string }>;
    if (!response.ok || !data.success) {
      throw new Error(`Cloudflare error: ${JSON.stringify(data.errors)}`);
    }

    return { id: data.result.id as string };
  }

  async deleteRecord(id: string): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    const response = await fetch(`${this.baseUrl}/dns_records/${id}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (!response.ok) {
      const data = await response.json() as CloudflareResponse<unknown>;
      throw new Error(`Failed to delete DNS record: ${JSON.stringify(data.errors)}`);
    }
  }
}
