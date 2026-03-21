import { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { generateNotFoundPage } from "../lib/notFoundPage";
import { isSupportedPlatformUrl } from "../lib/platforms";
import { prisma } from "../db/prisma";
import { AnalyticsService } from "../services/analytics";
import { tunnelManager } from "../tunnel/tunnelManager";

const analyticsService = new AnalyticsService();

function extractSubdomain(hostHeader: string | undefined) {
  const host = (hostHeader || "").split(",")[0].trim();
  if (!host) {
    return null;
  }

  const hostname = host.split(":")[0];
  if (!hostname.endsWith(config.BASE_DOMAIN)) {
    return null;
  }

  const subdomain = hostname.replace(`.${config.BASE_DOMAIN}`, "");
  return subdomain && subdomain !== hostname ? subdomain : null;
}

// Dangerous headers that should never be forwarded to prevent security issues
const DANGEROUS_HEADERS = [
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
];

// Sanitize headers to prevent header injection attacks
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Skip dangerous headers
    if (DANGEROUS_HEADERS.includes(lowerKey)) {
      continue;
    }

    // Skip undefined values
    if (value === undefined) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

async function buildRequestBody(request: any) {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  if (Buffer.isBuffer(request.body) || typeof request.body === "string") {
    return request.body;
  }

  const contentType = request.headers["content-type"] || "";
  if (request.body == null) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return JSON.stringify(request.body);
  }

  if (contentType.includes("application/x-www-form-urlencoded") && typeof request.body === "object") {
    return new URLSearchParams(request.body as Record<string, string>).toString();
  }

  return JSON.stringify(request.body);
}

export async function publicProxy(fastify: FastifyInstance) {
  fastify.route({
    method: ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT"],
    url: "/*",
    handler: async (request, reply) => {
      const host = request.headers["x-forwarded-host"]?.toString() || request.headers.host;
      const subdomain = extractSubdomain(host);

      if (!subdomain) {
        reply.header("Content-Type", "text/html; charset=utf-8");
        return reply.status(404).send(generateNotFoundPage(null));
      }

      const tunnel = tunnelManager.get(subdomain);
      if (tunnel) {
        // Check rate limit for this tunnel
        if (!tunnelManager.checkRateLimit(subdomain)) {
          return reply.status(429).send({
            error: "Rate limit exceeded",
            message: `Too many requests to tunnel '${subdomain}'. Please slow down.`,
          });
        }

        const requestId = uuidv4();
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${request.method} ${request.url} -> ${subdomain}.sharelive.site`);

        // Build request body
        const body = await buildRequestBody(request);
        const bodyBase64 = body ? Buffer.from(body).toString('base64') : '';

        // Sanitize headers before forwarding
        const sanitizedHeaders = sanitizeHeaders(request.headers);

        tunnelManager.addPending(requestId, reply);
        tunnel.socket.send(JSON.stringify({
          type: "request",
          requestId,
          method: request.method,
          path: request.url,
          headers: sanitizedHeaders,
          body: bodyBase64,
        }));
        return;
      }

      const project = await prisma.project.findUnique({
        where: { subdomain },
      });

      if (!project || project.plan !== "free_proxy") {
        reply.header("Content-Type", "text/html; charset=utf-8");
        return reply.status(404).send(generateNotFoundPage(subdomain));
      }

      const targetUrl = new URL(project.targetUrl);
      const proxiedUrl = new URL(request.url, targetUrl);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value !== undefined && key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
          headers.set(key, Array.isArray(value) ? value.join(",") : String(value));
        }
      });
      headers.set("host", targetUrl.host);

      let response: Response;
      try {
        response = await fetch(proxiedUrl, {
          method: request.method,
          headers,
          body: await buildRequestBody(request),
          redirect: "manual",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(502).send({
          error: "Upstream target is unreachable",
          targetUrl: project.targetUrl,
        });
      }

      const clientIp = request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
        || request.ip
        || request.socket.remoteAddress
        || "unknown";
      void analyticsService.trackVisit(project.id, clientIp);

      response.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (!["content-length", "content-encoding", "transfer-encoding", "connection", "content-security-policy", "content-security-policy-report-only", "x-frame-options", "cross-origin-opener-policy", "cross-origin-resource-policy", "cross-origin-embedder-policy"].includes(lower)) {
          reply.header(key, value);
        }
      });

      if (!isSupportedPlatformUrl(project.targetUrl)) {
        reply.header("X-ShareLive-View-Only", "true");
      }

      const body = Buffer.from(await response.arrayBuffer());
      return reply.code(response.status).send(body);
    },
  });
}
