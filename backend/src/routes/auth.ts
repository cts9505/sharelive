import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import { VerificationService } from '../services/verification';
import { authenticate } from './authenticate';

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
  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      const result = await authService.register(parsed.data.email, parsed.data.password);

      let verificationEmailSent = false;
      try {
        await verificationService.sendEmailVerification(result.user.id);
        verificationEmailSent = true;
      } catch (verificationError) {
        fastify.log.error(verificationError);
      }

      return reply.status(201).send({ ...result, verificationEmailSent });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return reply.status(409).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }

      const result = await authService.login(parsed.data.email, parsed.data.password);
      return reply.send(result);
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        return reply.status(401).send({ error: error.message });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get('/api/auth/me', { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return reply.send({ user: request.user });
  });

  // Forgot password
  fastify.post('/api/auth/forgot-password', async (request, reply) => {
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

  // Verify reset OTP
  fastify.post('/api/auth/verify-reset-otp', async (request, reply) => {
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

  // Reset password
  fastify.post('/api/auth/reset-password', async (request, reply) => {
    try {
      const parsed = resetPasswordSchema.parse(request.body);
      return reply.send(
        await verificationService.resetPassword(parsed.email, parsed.resetToken, parsed.password)
      );
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
