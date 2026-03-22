import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const feedbackSchema = z.object({
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please enter at least 10 characters').max(5000),
  sourcePage: z.string().trim().max(255).optional(),
});

const bugReportSchema = z.object({
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  summary: z.string().trim().min(5, 'Please add a short summary').max(255),
  details: z.string().trim().min(20, 'Please add enough detail to reproduce the issue').max(8000),
  sourcePage: z.string().trim().max(255).optional(),
});

function emptyToNull(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === '' ? null : value;
}

function getIpAddress(forwardedFor: string | string[] | undefined, requestIp: string) {
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0] ?? requestIp;
  }

  if (typeof forwardedFor === 'string' && forwardedFor.trim() !== '') {
    return forwardedFor.split(',')[0]?.trim() ?? requestIp;
  }

  return requestIp;
}

export async function feedbackRoutes(fastify: FastifyInstance) {
  const feedbackPaths = ['/feedback', '/api/feedback'];
  const bugReportPaths = ['/report-bug', '/api/report-bug', '/bug-reports', '/api/bug-reports'];

  for (const path of feedbackPaths) {
    fastify.post(path, async (request, reply) => {
      const parsed = feedbackSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      try {
        const feedback = await prisma.feedbackSubmission.create({
          data: {
            email: emptyToNull(parsed.data.email),
            message: parsed.data.message,
            sourcePage: emptyToNull(parsed.data.sourcePage),
            userAgent: request.headers['user-agent'] ?? null,
            ipAddress: getIpAddress(request.headers['x-forwarded-for'], request.ip),
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

        return reply.status(201).send({
          success: true,
          message: 'Feedback submitted successfully',
          feedback,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to store feedback' });
      }
    });
  }

  for (const path of bugReportPaths) {
    fastify.post(path, async (request, reply) => {
      const parsed = bugReportSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      try {
        const bugReport = await prisma.bugReport.create({
          data: {
            email: emptyToNull(parsed.data.email),
            summary: parsed.data.summary,
            details: parsed.data.details,
            sourcePage: emptyToNull(parsed.data.sourcePage),
            userAgent: request.headers['user-agent'] ?? null,
            ipAddress: getIpAddress(request.headers['x-forwarded-for'], request.ip),
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

        return reply.status(201).send({
          success: true,
          message: 'Bug report submitted successfully',
          bugReport,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to store bug report' });
      }
    });
  }
}
