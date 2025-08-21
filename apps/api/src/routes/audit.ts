import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { requireRole } from '../plugins/authenticate';
import archiver from 'archiver';

const auditQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
});

export const auditRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', {
    preHandler: requireRole([UserRole.ADMIN, UserRole.AUDITOR]),
  }, async (request) => {
    const query = auditQuerySchema.parse(request.query);

    const where: any = {};
    
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.userId) where.userId = query.userId;
    
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      server.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      server.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  });

  server.get('/farm/:farmId', {
    preHandler: server.authenticate,
  }, async (request, reply) => {
    const { farmId } = request.params as { farmId: string };
    const { orgId, role } = request.user as any;

    const farm = await server.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      return reply.status(404).send({ error: 'Farm not found' });
    }

    if (role !== UserRole.ADMIN && role !== UserRole.AUDITOR && farm.orgId !== orgId) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const logs = await server.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'farm', entityId: farmId },
          { entityType: 'application', entityId: { in: await getApplicationIds(farmId) } },
          { entityType: 'payment', entityId: { in: await getPaymentIds(farmId) } },
          { entityType: 'compliance', entityId: { in: await getComplianceIds(farmId) } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    async function getApplicationIds(farmId: string) {
      const apps = await server.prisma.application.findMany({
        where: { farmId },
        select: { id: true },
      });
      return apps.map(a => a.id);
    }

    async function getPaymentIds(farmId: string) {
      const payments = await server.prisma.payment.findMany({
        where: { farmId },
        select: { id: true },
      });
      return payments.map(p => p.id);
    }

    async function getComplianceIds(farmId: string) {
      const logs = await server.prisma.complianceLog.findMany({
        where: { farmId },
        select: { id: true },
      });
      return logs.map(l => l.id);
    }

    return logs;
  });

  server.get('/export/:farmId', {
    preHandler: requireRole([UserRole.ADMIN, UserRole.AUDITOR]),
  }, async (request, reply) => {
    const { farmId } = request.params as { farmId: string };

    const [farm, applications, payments, compliance, auditLogs] = await Promise.all([
      server.prisma.farm.findUnique({
        where: { id: farmId },
        include: {
          owner: true,
          organization: true,
          documents: true,
        },
      }),
      server.prisma.application.findMany({
        where: { farmId },
        include: { program: true },
      }),
      server.prisma.payment.findMany({
        where: { farmId },
        include: { program: true },
      }),
      server.prisma.complianceLog.findMany({
        where: { farmId },
      }),
      server.prisma.auditLog.findMany({
        where: {
          OR: [
            { entityType: 'farm', entityId: farmId },
            { 
              entityType: 'application', 
              entityId: { 
                in: await server.prisma.application.findMany({
                  where: { farmId },
                  select: { id: true },
                }).then(apps => apps.map(a => a.id))
              }
            },
          ],
        },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      farm,
      applications,
      payments,
      compliance,
      auditLogs,
      summary: {
        totalApplications: applications.length,
        totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
        complianceRecords: compliance.length,
        auditEntries: auditLogs.length,
      },
    };

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="farm-${farmId}-audit-${Date.now()}.json"`);

    return exportData;
  });

  server.get('/stats', {
    preHandler: requireRole([UserRole.ADMIN]),
  }, async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, recentLogs, topUsers, topEntities] = await Promise.all([
      server.prisma.auditLog.count(),
      server.prisma.auditLog.count({
        where: { timestamp: { gte: thirtyDaysAgo } },
      }),
      server.prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
      server.prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
      }),
    ]);

    const userDetails = await Promise.all(
      topUsers.map(async (u) => {
        const user = await server.prisma.user.findUnique({
          where: { id: u.userId },
          select: { name: true, email: true },
        });
        return {
          ...user,
          actionCount: u._count.userId,
        };
      })
    );

    return {
      totalLogs,
      recentLogs,
      topUsers: userDetails,
      entityBreakdown: topEntities.map(e => ({
        type: e.entityType,
        count: e._count.entityType,
      })),
    };
  });
};