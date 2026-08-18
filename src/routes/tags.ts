import type { FastifyInstance } from 'fastify';
import type { Tag, CreateTag, UpdateTag } from '../types';

export default async function tagRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/tags - List all tags (system + user custom)
  app.get<{ Reply: Tag[] }>('/tags', { onRequest: [app.authenticate] }, async (request, reply) => {
    const userId = request.user!.sub;
    return reply.send(db.getAllTagsForUser(userId));
  });

  // POST /api/tags - Create custom tag
  app.post<{ Body: CreateTag; Reply: Tag | { error: string } }>(
    '/tags',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const data = request.body;

      if (!data.name || data.name.trim() === '') {
        return reply.code(400).send({ error: '标签名称不能为空' });
      }

      const database = db.getUserDatabase(userId);
      const id = db.nextTagId(userId);

      const tag: Tag = {
        id,
        name: data.name,
        category: 'custom', // User-created tags are always custom
        color: data.color ?? '#6B7280',
      };

      database.tags.push(tag);
      await db.persistUserDatabase(userId);

      return reply.code(201).send(tag);
    }
  );

  // GET /api/tags/:id - Get tag detail
  app.get<{ Params: { id: string }; Reply: Tag | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const result = db.findTagById(userId, id);
      if (!result) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      return reply.send(result.tag);
    }
  );

  // PATCH /api/tags/:id - Update tag (custom only, system tags are read-only)
  app.patch<{ Params: { id: string }; Body: UpdateTag; Reply: Tag | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const data = request.body;
      const result = db.findTagById(userId, id);

      if (!result) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      // System tags are read-only
      if (result.isSystem) {
        return reply.code(403).send({ error: '系统标签不可修改' });
      }

      const tag = result.tag;
      if (data.name !== undefined) tag.name = data.name;
      if (data.color !== undefined) tag.color = data.color;

      await db.persistUserDatabase(userId);
      return reply.send(tag);
    }
  );

  // DELETE /api/tags/:id - Delete tag (custom only, system tags cannot be deleted)
  app.delete<{ Params: { id: string }; Reply: { success: boolean } | { error: string } }>(
    '/tags/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的标签ID' });
      }

      const result = db.findTagById(userId, id);
      if (!result) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      // System tags cannot be deleted
      if (result.isSystem) {
        return reply.code(403).send({ error: '系统标签不可删除' });
      }

      const database = db.getUserDatabase(userId);
      const before = database.tags.length;
      database.tags = database.tags.filter((t) => t.id !== id);

      if (database.tags.length === before) {
        return reply.code(404).send({ error: `标签 ${id} 不存在` });
      }

      // Also remove from asset_tags
      database.asset_tags = database.asset_tags.filter((at) => at.tag_id !== id);

      await db.persistUserDatabase(userId);
      return reply.send({ success: true });
    }
  );
}
