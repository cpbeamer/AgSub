import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth';
import { farmRoutes } from './routes/farms';
import { programRoutes } from './routes/programs';
import { applicationRoutes } from './routes/applications';
import { complianceRoutes } from './routes/compliance';
import { paymentRoutes } from './routes/payments';
import { auditRoutes } from './routes/audit';
import { noticeRoutes } from './routes/notices';
import { authenticate } from './plugins/authenticate';
import { errorHandler } from './plugins/errorHandler';

config();

const prisma = new PrismaClient();

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function buildServer() {
  await server.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : true,
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false,
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
  });

  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  server.decorate('prisma', prisma);
  server.decorate('authenticate', authenticate);
  
  server.setErrorHandler(errorHandler);

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(farmRoutes, { prefix: '/api/farms' });
  await server.register(programRoutes, { prefix: '/api/programs' });
  await server.register(applicationRoutes, { prefix: '/api/applications' });
  await server.register(complianceRoutes, { prefix: '/api/compliance' });
  await server.register(paymentRoutes, { prefix: '/api/payments' });
  await server.register(auditRoutes, { prefix: '/api/audit' });
  await server.register(noticeRoutes, { prefix: '/api/notices' });

  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return server;
}

async function start() {
  try {
    const server = await buildServer();
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: any;
  }
}