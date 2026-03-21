import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProjectService } from '../services/projects';
import { authenticate, AuthenticatedRequest } from './authenticate';

const projectService = new ProjectService();

const createProjectSchema = z.object({
  subdomain: z.string().min(3).max(20).regex(/^[a-z0-9-]+$/),
  targetUrl: z.string().url(),
  hostingPlatform: z.string().optional(),
});

const updateProjectSchema = z.object({
  targetUrl: z.string().url().optional(),
  hostingPlatform: z.string().optional(),
});

const upgradeProjectSchema = z.object({
  hostingPlatform: z.string().optional(),
});

export async function projectsRoutes(fastify: FastifyInstance) {
  const checkPaths = ['/projects/check/:subdomain', '/api/projects/check/:subdomain'];
  const listPaths = ['/projects/my', '/api/projects/my'];
  const createPaths = ['/projects', '/api/projects'];
  const detailPaths = ['/projects/:id', '/api/projects/:id'];
  const upgradePaths = ['/projects/:id/upgrade', '/api/projects/:id/upgrade'];

  for (const path of checkPaths) {
    fastify.get(path, async (request, reply) => {
      const { subdomain } = request.params as { subdomain: string };
      const project = await projectService.resolve(subdomain);
      return reply.send({ available: !project, subdomain });
    });
  }

  for (const path of listPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      const user = (request as AuthenticatedRequest).user;
      const projects = await projectService.list(user.userId);
      return reply.send({ projects });
    });
  }

  for (const path of createPaths) {
    fastify.post(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const parsed = createProjectSchema.safeParse(request.body);

        if (!parsed.success) {
          return reply.status(400).send({ error: parsed.error.issues[0].message });
        }

        const project = await projectService.create(user.userId, parsed.data);
        return reply.status(201).send(project);
      } catch (error: any) {
        if (error.message === 'Subdomain already taken') {
          return reply.status(409).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of detailPaths) {
    fastify.get(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };
        const project = await projectService.get(id, user.userId);
        return reply.send(project);
      } catch (error: any) {
        if (error.message === 'Project not found') {
          return reply.status(404).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });

    fastify.patch(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };
        const parsed = updateProjectSchema.safeParse(request.body);

        if (!parsed.success) {
          return reply.status(400).send({ error: parsed.error.issues[0].message });
        }

        const project = await projectService.update(id, user.userId, parsed.data);
        return reply.send(project);
      } catch (error: any) {
        if (error.message === 'Project not found') {
          return reply.status(404).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });

    fastify.delete(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };
        await projectService.delete(id, user.userId);
        return reply.status(204).send();
      } catch (error: any) {
        if (error.message === 'Project not found') {
          return reply.status(404).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of upgradePaths) {
    fastify.post(path, { preHandler: authenticate }, async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };
        const parsed = upgradeProjectSchema.safeParse(request.body);

        if (!parsed.success) {
          return reply.status(400).send({ error: parsed.error.issues[0].message });
        }

        return reply.send(await projectService.upgrade(id, user.userId, parsed.data));
      } catch (error: any) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }
}
