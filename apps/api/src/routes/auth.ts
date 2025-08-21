import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.nativeEnum(UserRole).default(UserRole.FARMER),
  organizationName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (server) => {
  server.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    
    const existingUser = await server.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    let orgId: string | undefined;
    
    if (body.organizationName) {
      const org = await server.prisma.organization.create({
        data: {
          name: body.organizationName,
          type: body.role === UserRole.FARMER ? 'FARM' : 'CONSULTANT',
        },
      });
      orgId = org.id;
    }

    const user = await server.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: body.role,
        orgId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
      },
    });

    const token = server.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

    return { user, token };
  });

  server.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await server.prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        orgId: true,
      },
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(body.password, user.password);

    if (!validPassword) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = server.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

    const { password, ...userWithoutPassword } = user;

    await server.prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: 'auth',
        entityId: user.id,
        action: 'login',
        metadata: {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
      },
    });

    return { user: userWithoutPassword, token };
  });

  server.get('/me', { preHandler: server.authenticate }, async (request) => {
    const { id } = request.user as any;

    const user = await server.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
        organization: true,
      },
    });

    return user;
  });

  server.post('/logout', { preHandler: server.authenticate }, async (request) => {
    const { id } = request.user as any;

    await server.prisma.auditLog.create({
      data: {
        userId: id,
        entityType: 'auth',
        entityId: id,
        action: 'logout',
        metadata: {
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
      },
    });

    return { message: 'Logged out successfully' };
  });
};