import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { promises as fs } from 'fs';
import { DatabaseManager } from './db';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import transactionRoutes from './routes/transactions';
import tagRoutes from './routes/tags';
import summaryRoutes from './routes/summary';
import exportImportRoutes from './routes/export-import';

declare module 'fastify' {
  interface FastifyInstance {
    db: DatabaseManager;
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}

async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  });

  // Determine data directory
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  await fs.mkdir(dataDir, { recursive: true });

  // Initialize database
  const dbManager = new DatabaseManager(dataDir);
  await dbManager.init();
  app.decorate('db', dbManager);

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register auth plugin (JWT)
  await app.register(authPlugin);

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Root endpoint
  app.get('/', async (request, reply) => {
    return reply.type('text/html').send(`<!DOCTYPE html>
<html>
<head><title>Investment Tracker Server</title></head>
<body>
<h1>Investment Tracker Server</h1>
<p>API is running. Available endpoints:</p>
<ul>
<li><a href="/api/health">/api/health</a> - Health check</li>
<li><a href="/api/auth/register">POST /api/auth/register</a> - Register</li>
<li><a href="/api/auth/login">POST /api/auth/login</a> - Login</li>
<li><a href="/api/assets">/api/assets</a> - Assets (requires auth)</li>
<li><a href="/api/transactions">/api/transactions</a> - Transactions (requires auth)</li>
<li><a href="/api/tags">/api/tags</a> - Tags (requires auth)</li>
<li><a href="/api/summary">/api/summary</a> - Summary (requires auth)</li>
<li><a href="/api/export">/api/export</a> - Export data (requires auth)</li>
</ul>
</body></html>`);
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(assetRoutes, { prefix: '/api' });
  await app.register(transactionRoutes, { prefix: '/api' });
  await app.register(tagRoutes, { prefix: '/api' });
  await app.register(summaryRoutes, { prefix: '/api' });
  await app.register(exportImportRoutes, { prefix: '/api' });

  // Serve static frontend files from dist/ directory
  const distPath = path.join(__dirname, '..', 'dist');
  try {
    await fs.access(distPath);
    await app.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });
  } catch {
    app.log.warn('dist/ directory not found. Static file serving disabled.');
  }

  return app;
}

async function start() {
  try {
    const app = await buildServer();
    const port = parseInt(process.env.PORT || '8080', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`Server running at http://${host}:${port}`);
    app.log.info(`Data directory: ${path.join(__dirname, '..', 'data')}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
