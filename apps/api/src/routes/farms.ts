import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { requireRole } from '../plugins/authenticate';

const createFarmSchema = z.object({
  name: z.string().min(1),
  acres: z.number().positive(),
  location: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
  address: z.string(),
  crops: z.array(z.string()),
  livestock: z.array(z.string()),
  practices: z.array(z.string()),
});

const updateFarmSchema = createFarmSchema.partial();

export const farmRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', { preHandler: server.authenticate }, async (request) => {
    const { id, role, orgId } = request.user as any;

    const where = role === UserRole.ADMIN 
      ? {} 
      : role === UserRole.AUDITOR 
      ? {} 
      : { orgId };

    const farms = await server.prisma.farm.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        organization: true,
        _count: {
          select: {
            applications: true,
            payments: true,
            complianceLogs: true,
          },
        },
      },
    });

    return farms;
  });

  server.get('/:id', { preHandler: server.authenticate }, async (request, reply) => {
    const { id: userId, role, orgId } = request.user as any;
    const { id } = request.params as { id: string };

    const farm = await server.prisma.farm.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        organization: true,
        applications: {
          include: { program: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        complianceLogs: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        enrollments: {
          where: { isActive: true },
          include: { program: true },
        },
      },
    });

    if (!farm) {
      return reply.status(404).send({ error: 'Farm not found' });
    }

    if (role !== UserRole.ADMIN && role !== UserRole.AUDITOR && farm.orgId !== orgId) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    return farm;
  });

  server.post('/', { preHandler: server.authenticate }, async (request, reply) => {
    const { id: userId, orgId } = request.user as any;
    const body = createFarmSchema.parse(request.body);

    if (!orgId) {
      return reply.status(400).send({ error: 'Organization required' });
    }

    const farm = await server.prisma.farm.create({
      data: {
        ...body,
        ownerId: userId,
        orgId,
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'farm',
        entityId: farm.id,
        action: 'create',
        newData: farm,
      },
    });

    return farm;
  });

  server.patch('/:id', { preHandler: server.authenticate }, async (request, reply) => {
    const { id: userId, role, orgId } = request.user as any;
    const { id } = request.params as { id: string };
    const body = updateFarmSchema.parse(request.body);

    const farm = await server.prisma.farm.findUnique({
      where: { id },
    });

    if (!farm) {
      return reply.status(404).send({ error: 'Farm not found' });
    }

    if (role !== UserRole.ADMIN && farm.orgId !== orgId) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const updatedFarm = await server.prisma.farm.update({
      where: { id },
      data: body,
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'farm',
        entityId: farm.id,
        action: 'update',
        oldData: farm,
        newData: updatedFarm,
      },
    });

    return updatedFarm;
  });

  server.delete('/:id', { 
    preHandler: requireRole([UserRole.ADMIN]) 
  }, async (request, reply) => {
    const { id: userId } = request.user as any;
    const { id } = request.params as { id: string };

    const farm = await server.prisma.farm.findUnique({
      where: { id },
    });

    if (!farm) {
      return reply.status(404).send({ error: 'Farm not found' });
    }

    await server.prisma.farm.delete({
      where: { id },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'farm',
        entityId: id,
        action: 'delete',
        oldData: farm,
      },
    });

    return { message: 'Farm deleted successfully' };
  });
};