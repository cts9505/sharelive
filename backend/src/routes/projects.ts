import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProjectService } from '../services/projects';
import { authenticate } from './authenticate';

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
  // Check subdomain availability
  fastify.get('/api/projects/check/:subdomain', async (request, reply) => {
    const { subdomain } = request.params as { subdomain: string };
    const project = await projectService.resolve(subdomain);
    return reply.send({ available: !project, subdomain });
  });

  // List user's projects
  fastify.get('/api/projects/my', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    const projects = await projectService.list(request.user.userId);
    return reply.send({ projects });
  });

  // Create new project
  fastify.post('/api/projects', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const parsed = createProjectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      const project = await projectService.create(request.user.userId, parsed.data);
      return reply.status(201).send(project);
    } catch (error: any) {
      if (error.message === 'Subdomain already taken') {
        return reply.status(409).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get project by ID
  fastify.get('/api/projects/:id', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const { id } = request.params as { id: string };
      const project = await projectService.get(id, request.user.userId);
      return reply.send(project);
    } catch (error: any) {
      if (error.message === 'Project not found') {
        return reply.status(404).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update project
  fastify.patch('/api/projects/:id', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const { id } = request.params as { id: string };
      const parsed = updateProjectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      const project = await projectService.update(id, request.user.userId, parsed.data);
      return reply.send(project);
    } catch (error: any) {
      if (error.message === 'Project not found') {
        return reply.status(404).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete project
  fastify.delete('/api/projects/:id', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const { id } = request.params as { id: string };
      await projectService.delete(id, request.user.userId);
      return reply.status(204).send();
    } catch (error: any) {
      if (error.message === 'Project not found') {
        return reply.status(404).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Upgrade project
  fastify.post('/api/projects/:id/upgrade', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const { id } = request.params as { id: string };
      const parsed = upgradeProjectSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      return reply.send(await projectService.upgrade(id, request.user.userId, parsed.data));
    } catch (error: any) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
