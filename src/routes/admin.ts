import type { FastifyInstance } from 'fastify';
import { serializeDatabase } from '../db';

export default async function adminRoutes(app: FastifyInstance) {
  const db = app.db;

  // Admin guard — runs after authenticate
  async function requireAdmin(request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) {
    const userId = request.user!.sub;
    if (!db.isAdmin(userId)) {
      return reply.code(403).send({ error: '需要管理员权限' });
    }
  }

  // GET /api/admin/me - Check if current user is admin
  app.get('/me', { onRequest: [app.authenticate] }, async (request, reply) => {
    const userId = request.user!.sub;
    return reply.send({ isAdmin: db.isAdmin(userId) });
  });

  // GET /api/admin/users - List all users
  app.get('/users', { onRequest: [app.authenticate, requireAdmin] }, async (request, reply) => {
    return reply.send(db.listUsers());
  });

  // DELETE /api/admin/users/:id - Delete a user and all their data
  app.delete<{ Params: { id: string } }>(
    '/users/:id',
    { onRequest: [app.authenticate, requireAdmin] },
    async (request, reply) => {
      const targetId = request.params.id;
      const adminId = request.user!.sub;

      if (targetId === adminId) {
        return reply.code(400).send({ error: '不能删除自己的账户' });
      }

      try {
        const ok = await db.deleteUser(targetId);
        if (!ok) {
          return reply.code(404).send({ error: '用户不存在' });
        }
        return reply.send({ success: true });
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // GET /api/admin/users/:id/data - Export a specific user's data
  app.get<{ Params: { id: string } }>(
    '/users/:id/data',
    { onRequest: [app.authenticate, requireAdmin] },
    async (request, reply) => {
      const targetId = request.params.id;
      const users = db.listUsers();
      const target = users.find((u) => u.id === targetId);
      if (!target) {
        return reply.code(404).send({ error: '用户不存在' });
      }

      const database = db.getUserDatabase(targetId);
      const json = serializeDatabase(database);
      return reply
        .header('Content-Type', 'application/json')
        .header('Content-Disposition', `attachment; filename="user-${target.username}-data.json"`)
        .send(json);
    }
  );

  // GET /api/admin/system-tags - List system tags
  app.get('/system-tags', { onRequest: [app.authenticate, requireAdmin] }, async (request, reply) => {
    return reply.send(db.getSystemTags());
  });

  // POST /api/admin/system-tags - Create a system tag
  app.post<{ Body: { name: string; color?: string } }>(
    '/system-tags',
    { onRequest: [app.authenticate, requireAdmin] },
    async (request, reply) => {
      const { name, color } = request.body;
      if (!name || name.trim() === '') {
        return reply.code(400).send({ error: '标签名称不能为空' });
      }

      const existing = db.getSystemTags();
      const id = existing.length > 0 ? Math.max(...existing.map((t) => t.id)) + 1 : 1;
      const tag = {
        id,
        name: name.trim(),
        category: 'system',
        color: color ?? '#6B7280',
      };
      await db.createSystemTag(tag);
      return reply.code(201).send(tag);
    }
  );

  // PATCH /api/admin/system-tags/:id - Update a system tag
  app.patch<{ Params: { id: string }; Body: { name?: string; color?: string } }>(
    '/system-tags/:id',
    { onRequest: [app.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const ok = await db.updateSystemTag(id, request.body);
      if (!ok) {
        return reply.code(404).send({ error: '标签不存在' });
      }
      const tag = db.getSystemTags().find((t) => t.id === id);
      return reply.send(tag);
    }
  );

  // DELETE /api/admin/system-tags/:id - Delete a system tag
  app.delete<{ Params: { id: string } }>(
    '/system-tags/:id',
    { onRequest: [app.authenticate, requireAdmin] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const ok = await db.deleteSystemTag(id);
      if (!ok) {
        return reply.code(404).send({ error: '标签不存在' });
      }
      return reply.send({ success: true });
    }
  );
}
