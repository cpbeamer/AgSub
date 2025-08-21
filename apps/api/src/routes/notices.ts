import { FastifyPluginAsync } from 'fastify';
import OpenAI from 'openai';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { requireRole } from '../plugins/authenticate';

const parseNoticeSchema = z.object({
  content: z.string(),
  title: z.string(),
  publishDate: z.string().datetime(),
});

export const noticeRoutes: FastifyPluginAsync = async (server) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  server.post('/parse', {
    preHandler: requireRole([UserRole.ADMIN, UserRole.CONSULTANT]),
  }, async (request) => {
    const { content, title, publishDate } = parseNoticeSchema.parse(request.body);

    const prompt = `
      Parse the following USDA program notice and extract structured information.
      Return a JSON object with the following fields:
      - programId: string (unique identifier)
      - name: string (program name)
      - description: string (brief description)
      - eligibilityRules: object with fields:
        - minAcres: number or null
        - maxAcres: number or null
        - requiredCrops: array of strings
        - requiredPractices: array of strings
        - otherRequirements: array of strings
      - paymentRates: object with fields:
        - perAcre: number or null
        - basePay: number or null
        - practices: object mapping practice names to payment amounts
        - maxPayment: number or null
      - formsRequired: array of form IDs/names
      - applicationDeadline: ISO date string or null
      - programPeriod: object with start and end dates

      Notice content:
      ${content}
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at parsing USDA program notices and extracting structured data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const parsedData = JSON.parse(completion.choices[0].message.content || '{}');

      const existingProgram = await server.prisma.program.findUnique({
        where: { programId: parsedData.programId },
      });

      let program;
      
      if (existingProgram) {
        program = await server.prisma.program.update({
          where: { id: existingProgram.id },
          data: {
            name: parsedData.name,
            description: parsedData.description,
            eligibilityRules: parsedData.eligibilityRules,
            paymentRates: parsedData.paymentRates,
            formsRequired: parsedData.formsRequired,
            startDate: parsedData.programPeriod?.start ? new Date(parsedData.programPeriod.start) : new Date(),
            endDate: parsedData.programPeriod?.end ? new Date(parsedData.programPeriod.end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        program = await server.prisma.program.create({
          data: {
            programId: parsedData.programId,
            name: parsedData.name,
            description: parsedData.description,
            eligibilityRules: parsedData.eligibilityRules,
            paymentRates: parsedData.paymentRates,
            formsRequired: parsedData.formsRequired,
            startDate: parsedData.programPeriod?.start ? new Date(parsedData.programPeriod.start) : new Date(),
            endDate: parsedData.programPeriod?.end ? new Date(parsedData.programPeriod.end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        });
      }

      const notice = await server.prisma.notice.create({
        data: {
          programId: program.id,
          title,
          content,
          parsedData,
          publishDate: new Date(publishDate),
        },
      });

      const { id: userId } = request.user as any;
      await server.prisma.auditLog.create({
        data: {
          userId,
          entityType: 'notice',
          entityId: notice.id,
          action: 'parse',
          newData: parsedData,
        },
      });

      return {
        notice,
        program,
        parsedData,
      };
    } catch (error) {
      server.log.error('Failed to parse notice:', error);
      throw new Error('Failed to parse notice');
    }
  });

  server.get('/', async (request) => {
    const notices = await server.prisma.notice.findMany({
      orderBy: { publishDate: 'desc' },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            programId: true,
          },
        },
      },
    });

    return notices;
  });
};