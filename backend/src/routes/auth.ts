import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import { VerificationService } from '../services/verification';

const authService = new AuthService();
const verificationService = new VerificationService();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(32),
  password: z.string().min(8),
});

export async function authRoutes(fastify: FastifyInstance) {
  const registerPaths = ['/auth/register', '/api/auth/register'];
  const loginPaths = ['/auth/login', '/api/auth/login'];
  const mePaths = ['/auth/me', '/api/auth/me'];
  const forgotPaths = ['/auth/forgot-password', '/api/auth/forgot-password'];
  const verifyResetPaths = ['/auth/verify-reset-otp', '/api/auth/verify-reset-otp'];
  const resetPasswordPaths = ['/auth/reset-password', '/api/auth/reset-password'];

  for (const path of registerPaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({ error: parsed.error.issues[0].message });
        }

        const result = await authService.register(
          parsed.data.email,
          parsed.data.password
        );
        return reply.status(201).send(result);
      } catch (error: any) {
        if (error.message === 'Email already registered') {
          return reply.status(409).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of loginPaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({ error: parsed.error.issues[0].message });
        }

        const result = await authService.login(
          parsed.data.email,
          parsed.data.password
        );
        return reply.send(result);
      } catch (error: any) {
        if (error.message === 'Invalid email or password') {
          return reply.status(401).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of mePaths) {
    fastify.get(path, async (request, reply) => {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const payload = await authService.verifyToken(token);
        if (!payload) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        return reply.send({ user: { id: payload.userId, email: payload.email } });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of forgotPaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = forgotPasswordSchema.parse(request.body);
        return reply.send(await verificationService.sendPasswordReset(parsed.email));
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.issues[0].message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of verifyResetPaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = verifyResetOtpSchema.parse(request.body);
        return reply.send(await verificationService.verifyResetOtp(parsed.email, parsed.otp));
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.issues[0].message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }

  for (const path of resetPasswordPaths) {
    fastify.post(path, async (request, reply) => {
      try {
        const parsed = resetPasswordSchema.parse(request.body);
        return reply.send(await verificationService.resetPassword(parsed.email, parsed.resetToken, parsed.password));
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: error.issues[0].message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    });
  }
}
