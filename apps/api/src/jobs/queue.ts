import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Queue definitions
export const noticeProcessingQueue = new Queue('notice-processing', {
  connection: redis,
});

export const complianceCheckQueue = new Queue('compliance-check', {
  connection: redis,
});

export const paymentProcessingQueue = new Queue('payment-processing', {
  connection: redis,
});

// Worker for processing program notices
const noticeWorker = new Worker(
  'notice-processing',
  async (job: Job) => {
    const { noticeId, content } = job.data;

    try {
      // Parse notice with OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Extract program details from USDA notices.',
          },
          {
            role: 'user',
            content: `Parse this notice: ${content}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const parsedData = JSON.parse(completion.choices[0].message.content || '{}');

      // Update notice with parsed data
      await prisma.notice.update({
        where: { id: noticeId },
        data: { parsedData },
      });

      return { success: true, parsedData };
    } catch (error) {
      console.error('Notice processing failed:', error);
      throw error;
    }
  },
  { connection: redis }
);

// Worker for compliance checks
const complianceWorker = new Worker(
  'compliance-check',
  async (job: Job) => {
    const { farmId, satelliteImageId } = job.data;

    try {
      // Mock satellite image analysis
      const analysis = {
        cropCoverage: Math.random() * 400,
        practicesDetected: ['conservation tillage', 'cover crops'],
        confidence: 0.85,
      };

      // Update compliance logs
      const logs = await prisma.complianceLog.findMany({
        where: { farmId },
      });

      for (const log of logs) {
        const variance = ((analysis.cropCoverage - (log.acreageReported || 0)) / (log.acreageReported || 1)) * 100;
        
        await prisma.complianceLog.update({
          where: { id: log.id },
          data: {
            acreageActual: analysis.cropCoverage,
            variance,
            status: Math.abs(variance) > 10 ? 'VARIANCE_DETECTED' : 'COMPLIANT',
          },
        });
      }

      return { success: true, analysis };
    } catch (error) {
      console.error('Compliance check failed:', error);
      throw error;
    }
  },
  { connection: redis }
);

// Worker for payment processing
const paymentWorker = new Worker(
  'payment-processing',
  async (job: Job) => {
    const { paymentId } = job.data;

    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          processedDate: new Date(),
          transactionId: `TXN-${Date.now()}`,
        },
      });

      return { success: true, transactionId: `TXN-${Date.now()}` };
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  },
  { connection: redis }
);

// Queue event handlers
noticeWorker.on('completed', (job) => {
  console.log(`Notice processing completed: ${job.id}`);
});

complianceWorker.on('completed', (job) => {
  console.log(`Compliance check completed: ${job.id}`);
});

paymentWorker.on('completed', (job) => {
  console.log(`Payment processing completed: ${job.id}`);
});

// Error handlers
noticeWorker.on('failed', (job, err) => {
  console.error(`Notice processing failed: ${job?.id}`, err);
});

complianceWorker.on('failed', (job, err) => {
  console.error(`Compliance check failed: ${job?.id}`, err);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`Payment processing failed: ${job?.id}`, err);
});

// Export queue functions
export async function addNoticeProcessingJob(noticeId: string, content: string) {
  return noticeProcessingQueue.add('process-notice', { noticeId, content });
}

export async function addComplianceCheckJob(farmId: string, satelliteImageId: string) {
  return complianceCheckQueue.add('check-compliance', { farmId, satelliteImageId });
}

export async function addPaymentProcessingJob(paymentId: string) {
  return paymentProcessingQueue.add('process-payment', { paymentId });
}