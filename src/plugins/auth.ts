import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'investment-tracker-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export interface AuthUser {
  sub: string;
  username: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

async function authPlugin(app: import('fastify').FastifyInstance) {
  app.register(fastifyJwt, {
    secret: JWT_SECRET,
    sign: {
      expiresIn: TOKEN_EXPIRY,
    },
  });

  // Decorator for protecting routes
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: '未授权，请先登录' });
    }
  });
}

export default fp(authPlugin, { name: 'auth' });
