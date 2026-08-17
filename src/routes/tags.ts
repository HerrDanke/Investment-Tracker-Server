import type { FastifyInstance } from 'fastify';
import type { Tag, CreateTag, UpdateTag } from '../types';

export default async function tagRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/tags - List all tags
  app.get<{ Reply: Tag[] }>('/tags', { onRequest: [app.authenticate] }, async (request, reply) => {
    const database = db.getDatabase();
    return reply.send(database.tags);
  });

  // POST /api/tags - Create tag
  app.post<{ Body: CreateTag; Reply: Tag | { error: string } }>(
    '/tags',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const data = request.body;

      if (!data.name || data.name.trim() === '') {
        return reply.code(400).send({ error: '标签名称不能为空' });
      }

      const database = db.getDatabase();
      const id = db.nextTagId();

      const tag: Tag = {
        id,
        name: data.name,
        category: data.category ?? 'custom',
        color: data.color ?? '#6B7280',
      };

      database.tags.push(tag);
      await db.updateDatabase(database);

      return reply.code(201).send(tag);
    }
  );

  // GET /api/tags/:id - Get tag detail
  app.get<{ Params: { id: string }; Reply: Tag | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const database = db.getDatabase();
      const tag = database.tags.find((t) => t.id === id);

      if (!tag) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      return reply.send(tag);
    }
  );

  // PATCH /api/tags/:id - Update tag
  app.patch<{ Params: { id: string }; Body: UpdateTag; Reply: Tag | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const data = request.body;
      const database = db.getDatabase();
      const tag = database.tags.find((t) => t.id === id);

      if (!tag) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      if (data.name !== undefined) tag.name = data.name;
      if (data.category !== undefined) tag.category = data.category;
      if (data.color !== undefined) tag.color = data.color;

      await db.updateDatabase(database);
      return reply.send(tag);
    }
  );

  // DELETE /api/tags/:id - Delete tag
  app.delete<{ Params: { id: string }; Reply: { success: boolean } | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const database = db.getDatabase();
      const before = database.tags.length;
      database.tags = database.tags.filter((t) => t.id !== id);

      if (database.tags.length === before) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      // Also remove from asset_tags
      database.asset_tags = database.asset_tags.filter((at) => at.tag_id !== id);

      await db.updateDatabase(database);
      return reply.send({ success: true });
    }
  );
}
