import Fastify, { FastifyInstance } from 'fastify';
import fastifyJWT from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { config } from './config';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { terminalRoutes } from './routes/terminal';
import { fsRoutes } from './routes/fs';
import * as path from 'path';

/**
 * Create and configure Fastify server
 */
export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    trustProxy: true,
  });

  // Register JWT plugin
  await fastify.register(fastifyJWT, {
    secret: config.jwtSecret,
  });

  // Add authenticate decorator
  fastify.decorate('authenticate', authMiddleware);

  // Register CORS
  await fastify.register(fastifyCors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  // Register WebSocket support
  await fastify.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(terminalRoutes);
  await fastify.register(fsRoutes);

  // Serve static frontend files (in production)
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  try {
    await fastify.register(fastifyStatic, {
      root: frontendPath,
      prefix: '/',
    });

    // SPA fallback: serve index.html for all unmatched routes
    fastify.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api') && !request.url.startsWith('/ws')) {
        return reply.sendFile('index.html');
      }
      reply.code(404).send({ error: 'Not found' });
    });

    console.log(`📦 Serving static files from: ${frontendPath}`);
  } catch (err) {
    console.warn('⚠️  Frontend dist folder not found, skipping static file serving');
    console.warn('   Run the frontend build first if you want to serve it from the backend');
  }

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}
