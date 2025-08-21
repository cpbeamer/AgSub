import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ComplianceStatus } from '@prisma/client';

const logComplianceSchema = z.object({
  farmId: z.string(),
  practice: z.string(),
  date: z.string().datetime(),
  description: z.string().optional(),
  acreageReported: z.number().positive(),
  evidence: z.array(z.string()).optional(),
});

const satelliteComparisonSchema = z.object({
  farmId: z.string(),
  imageUrl: z.string(),
  captureDate: z.string().datetime(),
});

export const complianceRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', { preHandler: server.authenticate }, async (request) => {
    const { orgId, role } = request.user as any;

    const where = role === 'ADMIN' || role === 'AUDITOR' 
      ? {} 
      : { farm: { orgId } };

    const logs = await server.prisma.complianceLog.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return logs;
  });

  server.post('/log', { preHandler: server.authenticate }, async (request) => {
    const { id: userId } = request.user as any;
    const body = logComplianceSchema.parse(request.body);

    const log = await server.prisma.complianceLog.create({
      data: {
        farmId: body.farmId,
        practice: body.practice,
        date: new Date(body.date),
        description: body.description,
        acreageReported: body.acreageReported,
        evidence: body.evidence || [],
        status: ComplianceStatus.PENDING_REVIEW,
      },
    });

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'compliance',
        entityId: log.id,
        action: 'log',
        newData: log,
      },
    });

    return log;
  });

  server.post('/satellite', { preHandler: server.authenticate }, async (request) => {
    const { id: userId } = request.user as any;
    const { farmId, imageUrl, captureDate } = satelliteComparisonSchema.parse(request.body);

    const farm = await server.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new Error('Farm not found');
    }

    const mockSatelliteAnalysis = {
      totalAcres: farm.acres,
      cropCoverage: {
        corn: Math.random() * 200 + 100,
        soybeans: Math.random() * 150 + 50,
        coverCrop: Math.random() * 60 + 30,
      },
      practicesDetected: ['conservation tillage', 'cover crop'],
      anomalies: [],
      confidence: 0.85 + Math.random() * 0.1,
    };

    const recentLogs = await server.prisma.complianceLog.findMany({
      where: {
        farmId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const comparisonResults = await Promise.all(
      recentLogs.map(async (log) => {
        const actualAcres = mockSatelliteAnalysis.cropCoverage.coverCrop;
        const variance = ((actualAcres - (log.acreageReported || 0)) / (log.acreageReported || 1)) * 100;

        const status = Math.abs(variance) > 10 
          ? ComplianceStatus.VARIANCE_DETECTED 
          : ComplianceStatus.COMPLIANT;

        const updated = await server.prisma.complianceLog.update({
          where: { id: log.id },
          data: {
            acreageActual: actualAcres,
            variance,
            status,
            satelliteData: {
              imageUrl,
              captureDate,
              analysis: mockSatelliteAnalysis,
            },
          },
        });

        return {
          logId: log.id,
          practice: log.practice,
          reportedAcres: log.acreageReported,
          actualAcres,
          variance,
          status,
        };
      })
    );

    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'compliance',
        entityId: farmId,
        action: 'satellite_analysis',
        metadata: {
          imageUrl,
          captureDate,
          results: comparisonResults,
        },
      },
    });

    return {
      farmId,
      analysis: mockSatelliteAnalysis,
      comparisons: comparisonResults,
    };
  });

  server.get('/farm/:farmId', { preHandler: server.authenticate }, async (request) => {
    const { farmId } = request.params as { farmId: string };

    const logs = await server.prisma.complianceLog.findMany({
      where: { farmId },
      orderBy: { date: 'desc' },
    });

    const summary = {
      total: logs.length,
      compliant: logs.filter(l => l.status === ComplianceStatus.COMPLIANT).length,
      nonCompliant: logs.filter(l => l.status === ComplianceStatus.NON_COMPLIANT).length,
      pendingReview: logs.filter(l => l.status === ComplianceStatus.PENDING_REVIEW).length,
      varianceDetected: logs.filter(l => l.status === ComplianceStatus.VARIANCE_DETECTED).length,
    };

    return {
      summary,
      logs,
    };
  });
};