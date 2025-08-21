import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const matchProgramsSchema = z.object({
  farmId: z.string(),
});

export const programRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', async (request) => {
    const programs = await server.prisma.program.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            applications: true,
            enrollments: true,
          },
        },
      },
    });

    return programs;
  });

  server.get('/:id', async (request) => {
    const { id } = request.params as { id: string };

    const program = await server.prisma.program.findUnique({
      where: { id },
      include: {
        notices: {
          orderBy: { publishDate: 'desc' },
          take: 5,
        },
      },
    });

    return program;
  });

  server.post('/match', { preHandler: server.authenticate }, async (request) => {
    const { farmId } = matchProgramsSchema.parse(request.body);

    const farm = await server.prisma.farm.findUnique({
      where: { id: farmId },
    });

    if (!farm) {
      throw new Error('Farm not found');
    }

    const programs = await server.prisma.program.findMany({
      where: { isActive: true },
    });

    const eligiblePrograms = programs.map((program) => {
      const eligibilityRules = program.eligibilityRules as any;
      let score = 0;
      let isEligible = true;
      const reasons = [];

      if (eligibilityRules.minAcres && farm.acres < eligibilityRules.minAcres) {
        isEligible = false;
        reasons.push(`Farm size (${farm.acres} acres) below minimum (${eligibilityRules.minAcres} acres)`);
      }

      if (eligibilityRules.maxAcres && farm.acres > eligibilityRules.maxAcres) {
        isEligible = false;
        reasons.push(`Farm size (${farm.acres} acres) above maximum (${eligibilityRules.maxAcres} acres)`);
      }

      if (eligibilityRules.requiredCrops) {
        const hasRequiredCrops = eligibilityRules.requiredCrops.some((crop: string) =>
          farm.crops.includes(crop)
        );
        if (!hasRequiredCrops) {
          isEligible = false;
          reasons.push(`Missing required crops: ${eligibilityRules.requiredCrops.join(', ')}`);
        } else {
          score += 20;
        }
      }

      if (eligibilityRules.requiredPractices) {
        const matchingPractices = eligibilityRules.requiredPractices.filter((practice: string) =>
          farm.practices.includes(practice)
        );
        if (matchingPractices.length === 0) {
          isEligible = false;
          reasons.push(`Missing required practices: ${eligibilityRules.requiredPractices.join(', ')}`);
        } else {
          score += (matchingPractices.length / eligibilityRules.requiredPractices.length) * 30;
        }
      }

      if (isEligible) {
        score += 50;
      }

      const paymentRates = program.paymentRates as any;
      let estimatedPayment = 0;

      if (paymentRates.perAcre) {
        estimatedPayment += farm.acres * paymentRates.perAcre;
      }

      if (paymentRates.basePay) {
        estimatedPayment += paymentRates.basePay;
      }

      if (paymentRates.practices) {
        farm.practices.forEach((practice) => {
          if (paymentRates.practices[practice]) {
            estimatedPayment += paymentRates.practices[practice];
          }
        });
      }

      return {
        programId: program.id,
        programName: program.name,
        isEligible,
        confidence: score,
        estimatedPayment,
        reasons: isEligible ? [] : reasons,
      };
    });

    const sortedPrograms = eligiblePrograms
      .filter((p) => p.isEligible)
      .sort((a, b) => b.estimatedPayment - a.estimatedPayment);

    const { id: userId } = request.user as any;
    await server.prisma.auditLog.create({
      data: {
        userId,
        entityType: 'eligibility',
        entityId: farmId,
        action: 'match',
        metadata: {
          eligibleCount: sortedPrograms.length,
          totalPrograms: programs.length,
        },
      },
    });

    return {
      eligible: sortedPrograms,
      ineligible: eligiblePrograms.filter((p) => !p.isEligible),
      totalOpportunity: sortedPrograms.reduce((sum, p) => sum + p.estimatedPayment, 0),
    };
  });
};