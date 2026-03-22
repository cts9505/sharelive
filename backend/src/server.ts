import Fastify from "fastify";
import websocket from "@fastify/websocket";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config";
import { analyticsBuffer } from "./services/analytics";
import { tunnelSocket } from "./tunnel/tunnelSocket";
import { publicProxy } from "./routes/publicProxy";
import { analyticsRoutes } from "./routes/analytics";
import { authRoutes } from "./routes/auth";
import { feedbackRoutes } from "./routes/feedback";
import { paymentsRoutes } from "./routes/payments";
import { projectsRoutes } from "./routes/projects";
import { trackingRoutes } from "./routes/tracking";
import { usersRoutes } from "./routes/users";

async function start() {
  const fastify = Fastify({
    logger: true,
    bodyLimit: config.MAX_REQUEST_SIZE, // Limit request body size (default 10MB)
  });

  // Register CORS to allow requests from any origin
  await fastify.register(cors, {
    origin: config.NODE_ENV === 'production'
      ? config.CORS_ORIGINS
      : '*',
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  });

  // Register rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await fastify.register(websocket);

  // Register API routes
  await authRoutes(fastify);
  await projectsRoutes(fastify);
  await usersRoutes(fastify);
  await paymentsRoutes(fastify);
  await analyticsRoutes(fastify);
  await trackingRoutes(fastify);
  await feedbackRoutes(fastify);

  // Register tunnel routes
  await tunnelSocket(fastify);
  await publicProxy(fastify);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  await fastify.listen({
    port: config.PORT,
    host: config.HOST
  });

  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`🔐 Auth: ${config.REQUIRE_AUTH ? 'Required' : 'Optional'}`);
  console.log(`📦 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
}

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await analyticsBuffer.shutdown();
  process.exit(0);
};

process.on('SIGTERM', () => {
  void shutdown();
});

process.on('SIGINT', () => {
  void shutdown();
});

void start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
