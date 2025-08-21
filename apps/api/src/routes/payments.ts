import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

const createPaymentSchema = z.object({
  farmId: z.string(),
  programId: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const paymentRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', { preHandler: server.authenticate }, async (request) => {
    const { orgId, role } = request.user as any;

    const where = role === 'ADMIN' || role === 'AUDITOR'
      ? {}
      : { farm: { orgId } };

    const payments = await server.prisma.payment.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true },
        },
        program: {
          select: { id: true, name: true, programId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  });

  server.get('/farm/:farmId', { preHandler: server.authenticate }, async (request) => {
    const { farmId } = request.params as { farmId: string };

    const payments = await server.prisma.payment.findMany({
      where: { farmId },
      include: {
        program: {
          select: { id: true, name: true, programId: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const summary = {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.status === PaymentStatus.PENDING).reduce((sum, p) => sum + p.amount, 0),
      completed: payments.filter(p => p.status === PaymentStatus.COMPLETED).reduce((sum, p) => sum + p.amount, 0),
      scheduled: payments.filter(p => p.status === PaymentStatus.SCHEDULED).reduce((sum, p) => sum + p.amount, 0),
    };

    return {
      summary,
      payments,
    };
  });

  server.post('/add', { preHandler: server.authenticate }, async (request) => {
    const { id: userId } = request.user as any;
    const body = createPaymentSchema.parse(request.body);

    const payment = await server.prisma.payment.create({
      data: {
        farmId: body.farmId,
        programId: body.programId,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        status: PaymentStatus.PENDING,
        notes: body.notes,
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'payment',
        entityId: payment.id,
        action: 'create',
        newData: payment,
      },
    });

    return payment;
  });

  server.patch('/:id/status', { preHandler: server.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: PaymentStatus };
    const { id: userId } = request.user as any;

    const payment = await server.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return reply.status(404).send({ error: 'Payment not found' });
    }

    const updated = await server.prisma.payment.update({
      where: { id },
      data: {
        status,
        processedDate: status === PaymentStatus.COMPLETED ? new Date() : null,
        transactionId: status === PaymentStatus.COMPLETED ? `TXN-${Date.now()}` : null,
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'payment',
        entityId: id,
        action: 'status_update',
        oldData: { status: payment.status },
        newData: { status: updated.status },
      },
    });

    return updated;
  });

  server.get('/dashboard', { preHandler: server.authenticate }, async (request) => {
    const { orgId, role } = request.user as any;

    const where = role === 'ADMIN' || role === 'AUDITOR'
      ? {}
      : { farm: { orgId } };

    const [upcoming, overdue, recent] = await Promise.all([
      server.prisma.payment.findMany({
        where: {
          ...where,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.SCHEDULED] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          farm: { select: { name: true } },
          program: { select: { name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      server.prisma.payment.findMany({
        where: {
          ...where,
          status: PaymentStatus.PENDING,
          dueDate: { lt: new Date() },
        },
        include: {
          farm: { select: { name: true } },
          program: { select: { name: true } },
        },
        orderBy: { dueDate: 'desc' },
      }),
      server.prisma.payment.findMany({
        where: {
          ...where,
          status: PaymentStatus.COMPLETED,
        },
        include: {
          farm: { select: { name: true } },
          program: { select: { name: true } },
        },
        orderBy: { processedDate: 'desc' },
        take: 5,
      }),
    ]);

    return {
      upcoming,
      overdue,
      recent,
      stats: {
        upcomingTotal: upcoming.reduce((sum, p) => sum + p.amount, 0),
        overdueTotal: overdue.reduce((sum, p) => sum + p.amount, 0),
        recentTotal: recent.reduce((sum, p) => sum + p.amount, 0),
      },
    };
  });
};