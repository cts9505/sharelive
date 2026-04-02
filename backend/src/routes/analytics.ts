import { FastifyInstance } from "fastify";
import { AnalyticsService } from "../services/analytics";
import { ProjectService } from "../services/projects";
import { authenticate } from "./authenticate";

const analyticsService = new AnalyticsService();
const projectService = new ProjectService();

export async function analyticsRoutes(fastify: FastifyInstance) {
  // Get analytics summary
  fastify.get("/api/analytics/:projectId", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    const { projectId } = request.params as { projectId: string };
    const projects = await projectService.list(request.user.userId);

    if (!projects.some((project) => project.id === projectId)) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    return reply.send(await analyticsService.getSummary(projectId));
  });

  // Get daily analytics
  fastify.get("/api/analytics/:projectId/daily", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: "Unauthorized" });

    const { projectId } = request.params as { projectId: string };
    const { days } = request.query as { days?: string };
    const projects = await projectService.list(request.user.userId);

    if (!projects.some((project) => project.id === projectId)) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    return reply.send({
      analytics: await analyticsService.getRecentAnalytics(projectId, Number(days) || 7),
    });
  });
}
