import { FastifyInstance } from "fastify";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import { config } from "../config";
import { tunnelManager } from "./tunnelManager";
import { AuthService } from "../services/auth";
import { ProjectService } from "../services/projects";

export async function tunnelSocket(fastify: FastifyInstance) {
  const authService = new AuthService();
  const projectService = new ProjectService();

  fastify.get("/tunnel", { websocket: true }, (conn) => {

    const id = uuid();
    let subdomain = id.slice(0, 6); // Default auto-generated subdomain
    let registered = false;
    let authenticated = false;
    let userId: string | undefined = undefined;

    // Generate access token if enabled
    const accessToken = config.ENABLE_TUNNEL_TOKENS
      ? crypto.randomBytes(32).toString("hex")
      : undefined;

    const registerTunnel = () => {
      if (registered) {
        return;
      }

      // Free tier: All tunnels are free (random or custom subdomains)
      // - Custom subdomains are temporary and released when tunnel closes
      // Paid tier (future): Reserved subdomains persist after tunnel closes

      const now = new Date();
      const expiresAt = config.MAX_TUNNEL_LIFETIME > 0
        ? new Date(now.getTime() + config.MAX_TUNNEL_LIFETIME)
        : undefined;

      tunnelManager.register({
        id,
        subdomain,
        socket: conn.socket,
        accessToken,
        createdAt: now,
        expiresAt,
        authenticated,
        userId,
        requestCount: 0,
        lastRequestTime: Date.now(),
      });

      conn.socket.send(JSON.stringify({
        type: "tunnel_created",
        subdomain,
        authenticated,
        accessToken, // Send token to client if enabled
        expiresAt: expiresAt?.toISOString(),
      }));

      registered = true;
      console.log(
        expiresAt
          ? `[TUNNEL] New tunnel created: ${subdomain}.sharelive.site (expires: ${expiresAt.toISOString()})`
          : `[TUNNEL] New tunnel created: ${subdomain}.sharelive.site (no automatic expiry)`
      );
    };

    // Listen for custom subdomain registration
    conn.socket.on("message", (raw: any) => {
      const msgStr = raw.toString();
      let msg;

      try {
        msg = JSON.parse(msgStr);
      } catch (e) {
        return; // Ignore invalid JSON
      }

      if (msg.type === "auth" && typeof msg.token === "string") {
        authService.verifyToken(msg.token).then((payload) => {
          if (!payload) {
            conn.socket.send(JSON.stringify({
              type: "error",
              message: "Invalid authentication token."
            }));

            if (config.REQUIRE_AUTH) {
              conn.socket.close();
            }
            return;
          }

          authenticated = true;
          userId = payload.userId;
          conn.socket.send(JSON.stringify({
            type: "authenticated",
            email: payload.email,
            userId: payload.userId
          }));
        });
        return;
      }

      if (msg.type === "response") {
        tunnelManager.resolvePending(msg.requestId, msg);
        return;
      }

      // Handle custom subdomain registration
      if (msg.type === "register" && !registered && msg.subdomain) {
        const customSubdomain = msg.subdomain.toLowerCase().trim();

        // Free tier: Custom subdomains are allowed but temporary (released when tunnel closes)
        // Paid tier: Reserved subdomains persist even after tunnel closes

        // Validate subdomain format (alphanumeric and hyphens only, 3-20 chars)
        if (!/^[a-z0-9-]{3,20}$/.test(customSubdomain)) {
          conn.socket.send(JSON.stringify({
            type: "error",
            message: "Invalid subdomain. Use 3-20 characters (letters, numbers, hyphens only)"
          }));
          conn.socket.close();
          return;
        }

        // Check if subdomain is reserved in the database
        const reservedProject = await projectService.resolve(customSubdomain);
        if (reservedProject) {
          // Subdomain is reserved - check ownership
          if (!authenticated || reservedProject.ownerId !== userId) {
            conn.socket.send(JSON.stringify({
              type: "error",
              message: `Subdomain '${customSubdomain}' is reserved by another user. Please choose a different name.`
            }));
            conn.socket.close();
            return;
          }
          // Authenticated user owns this reserved subdomain - allow connection
        }

        // Check if subdomain is currently in use by an active tunnel
        if (tunnelManager.get(customSubdomain)) {
          conn.socket.send(JSON.stringify({
            type: "error",
            message: `Subdomain '${customSubdomain}' is already in use. Please choose another.`
          }));
          conn.socket.close();
          return;
        }

        // Use custom subdomain
        subdomain = customSubdomain;
        registerTunnel();
        return;
      }
    });

    // Auto-register with default subdomain if client doesn't send custom subdomain within 2 seconds
    setTimeout(() => {
      if (!registered) {
        registerTunnel();
      }
    }, 2000);

    conn.socket.on("close", () => {
      if (registered) {
        tunnelManager.remove(subdomain);
        console.log(`[TUNNEL] Tunnel closed: ${subdomain}.sharelive.site`);
      }
    });
  });
}
