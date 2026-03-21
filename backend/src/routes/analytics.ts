import { FastifyInstance } from "fastify";
import { AnalyticsService } from "../services/analytics";
import { ProjectService } from "../services/projects";
import { authenticate, AuthenticatedRequest } from "./authenticate";

const analyticsService = new AnalyticsService();
const projectService = new ProjectService();

export async function analyticsRoutes(fastify: FastifyInstance) {
  const detailPaths = ["/analytics/:projectId", "/api/analytics/:projectId"];
  const dailyPaths = ["/analytics/:projectId/daily", "/api/analytics/:projectId/daily"];

  for (const path of detailPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const userId = (request as AuthenticatedRequest).user.userId;
      const projects = await projectService.list(userId);

      if (!projects.some((project) => project.id === projectId)) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return reply.send(await analyticsService.getSummary(projectId));
    });
  }

  for (const path of dailyPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { days } = request.query as { days?: string };
      const userId = (request as AuthenticatedRequest).user.userId;
      const projects = await projectService.list(userId);

      if (!projects.some((project) => project.id === projectId)) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      return reply.send({
        analytics: await analyticsService.getRecentAnalytics(projectId, Number(days) || 7),
      });
    });
  }
}
