import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth';

const authService = new AuthService();

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
  };
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const payload = await authService.verifyToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid token' });
  }

  (request as AuthenticatedRequest).user = {
    userId: payload.userId,
    email: payload.email,
  };
}
