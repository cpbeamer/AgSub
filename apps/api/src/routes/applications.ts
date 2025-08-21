import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { ApplicationStatus } from '@prisma/client';

const createApplicationSchema = z.object({
  farmId: z.string(),
  programId: z.string(),
  formData: z.record(z.any()),
});

const generateFormSchema = z.object({
  farmId: z.string(),
  programId: z.string(),
});

export const applicationRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', { preHandler: server.authenticate }, async (request) => {
    const { orgId, role } = request.user as any;

    const where = role === 'ADMIN' || role === 'AUDITOR' 
      ? {} 
      : { farm: { orgId } };

    const applications = await server.prisma.application.findMany({
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

    return applications;
  });

  server.get('/:id', { preHandler: server.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const application = await server.prisma.application.findUnique({
      where: { id },
      include: {
        farm: true,
        program: true,
      },
    });

    if (!application) {
      return reply.status(404).send({ error: 'Application not found' });
    }

    return application;
  });

  server.post('/', { preHandler: server.authenticate }, async (request) => {
    const { id: userId } = request.user as any;
    const body = createApplicationSchema.parse(request.body);

    const application = await server.prisma.application.create({
      data: {
        farmId: body.farmId,
        programId: body.programId,
        formData: body.formData,
        status: ApplicationStatus.DRAFT,
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'application',
        entityId: application.id,
        action: 'create',
        newData: application,
      },
    });

    return application;
  });

  server.post('/generate', { preHandler: server.authenticate }, async (request, reply) => {
    const { farmId, programId } = generateFormSchema.parse(request.body);

    const [farm, program] = await Promise.all([
      server.prisma.farm.findUnique({ where: { id: farmId } }),
      server.prisma.program.findUnique({ where: { id: programId } }),
    ]);

    if (!farm || !program) {
      return reply.status(404).send({ error: 'Farm or program not found' });
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    doc.fontSize(20).text('USDA Program Application', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(`Program: ${program.name}`);
    doc.fontSize(12).text(`Program ID: ${program.programId}`);
    doc.moveDown();

    doc.fontSize(14).text('Farm Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Farm Name: ${farm.name}`);
    doc.text(`Location: ${farm.address}`);
    doc.text(`Total Acres: ${farm.acres}`);
    doc.text(`Crops: ${farm.crops.join(', ')}`);
    doc.text(`Livestock: ${farm.livestock.join(', ')}`);
    doc.text(`Current Practices: ${farm.practices.join(', ')}`);
    doc.moveDown();

    doc.fontSize(14).text('Program Details', { underline: true });
    doc.fontSize(12);
    const paymentRates = program.paymentRates as any;
    if (paymentRates.perAcre) {
      doc.text(`Payment per acre: $${paymentRates.perAcre}`);
      doc.text(`Estimated total: $${paymentRates.perAcre * farm.acres}`);
    }
    doc.moveDown();

    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, {
      align: 'center',
    });

    doc.end();

    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString('base64');

    const application = await server.prisma.application.create({
      data: {
        farmId,
        programId,
        status: ApplicationStatus.DRAFT,
        formData: {
          farmName: farm.name,
          acres: farm.acres,
          crops: farm.crops,
          practices: farm.practices,
        },
        pdfUrl: `data:application/pdf;base64,${base64}`,
      },
    });

    const { id: userId } = request.user as any;
    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'application',
        entityId: application.id,
        action: 'generate',
        metadata: { farmId, programId },
      },
    });

    return {
      applicationId: application.id,
      pdfData: base64,
    };
  });

  server.patch('/:id/submit', { preHandler: server.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { id: userId } = request.user as any;

    const application = await server.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return reply.status(404).send({ error: 'Application not found' });
    }

    if (application.status !== ApplicationStatus.DRAFT) {
      return reply.status(400).send({ error: 'Application already submitted' });
    }

    const updated = await server.prisma.application.update({
      where: { id },
      data: {
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'application',
        entityId: id,
        action: 'submit',
        oldData: { status: application.status },
        newData: { status: updated.status },
      },
    });

    return updated;
  });
};