import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from '../services/auth';

const authService = new AuthService();

export interface AuthUser {
  userId: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = await authService.verifyToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Unauthorized: Invalid or expired token' });
  }

  request.user = {
    userId: payload.userId,
    email: payload.email,
  };
}

export function requireAuth(request: FastifyRequest): request is FastifyRequest & { user: AuthUser } {
  return request.user !== undefined;
}
