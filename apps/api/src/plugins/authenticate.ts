import { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  orgId?: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(roles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      const user = request.user as JWTPayload;
      
      if (!roles.includes(user.role)) {
        reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}