import type { FastifyInstance } from 'fastify';
import type { Asset, CreateAsset, UpdateAsset, AssetWithTags, AssetDetail, Tag } from '../types';

export default async function assetRoutes(app: FastifyInstance) {
  const db = app.db;

  // Helper: resolve tags for an asset (system + user custom)
  function resolveAssetTags(userId: string, assetId: number): Tag[] {
    const database = db.getUserDatabase(userId);
    return database.asset_tags
      .filter((at) => at.asset_id === assetId)
      .map((at) => db.findTagById(userId, at.tag_id)?.tag)
      .filter((t): t is Tag => t !== undefined);
  }

  // Helper: check if tag exists (system or user custom)
  function tagExists(userId: string, tagId: number): boolean {
    return db.findTagById(userId, tagId) !== null;
  }

  // GET /api/assets - List all assets with tags
  app.get<{ Reply: AssetWithTags[] }>('/assets', { onRequest: [app.authenticate] }, async (request, reply) => {
    const userId = request.user!.sub;
    const database = db.getUserDatabase(userId);
    const result: AssetWithTags[] = database.assets.map((asset) => {
      const tags = resolveAssetTags(userId, asset.id);
      return { ...asset, tags };
    });
    return reply.send(result);
  });

  // POST /api/assets - Create asset
  app.post<{ Body: CreateAsset; Reply: Asset | { error: string } }>(
    '/assets',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const data = request.body;

      if (!data.name || data.name.trim() === '') {
        return reply.code(400).send({ error: '资产名称不能为空' });
      }

      const database = db.getUserDatabase(userId);
      const id = db.nextAssetId(userId);
      const now = new Date().toISOString();

      const asset: Asset = {
        id,
        name: data.name,
        symbol: data.symbol ?? null,
        asset_type: data.asset_type ?? 'stock',
        currency: data.currency ?? 'EUR',
        created_at: now,
        updated_at: now,
      };

      database.assets.push(asset);

      // Add tags if provided
      if (data.tag_ids && data.tag_ids.length > 0) {
        for (const tagId of data.tag_ids) {
          if (tagExists(userId, tagId)) {
            database.asset_tags.push({ asset_id: id, tag_id: tagId });
          }
        }
      }

      await db.persistUserDatabase(userId);
      return reply.code(201).send(asset);
    }
  );

  // GET /api/assets/:id - Get asset detail
  app.get<{ Params: { id: string }; Reply: AssetDetail | { error: string } }>(
    '/assets/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的资产ID' });
      }

      const database = db.getUserDatabase(userId);
      const asset = database.assets.find((a) => a.id === id);

      if (!asset) {
        return reply.code(404).send({ error: `资产 ${id} 不存在` });
      }

      const transactions = database.transactions.filter((t) => t.asset_id === id);
      const tags = resolveAssetTags(userId, id);

      // Calculate summary
      const buyTxns = transactions.filter((t) => t.txn_type === 'BUY');
      const sellTxns = transactions.filter((t) => t.txn_type === 'SELL');
      const buyQty = buyTxns.reduce((sum, t) => sum + t.quantity, 0);
      const sellQty = sellTxns.reduce((sum, t) => sum + t.quantity, 0);
      const holding = buyQty - sellQty;
      const buyCost = buyTxns.reduce((sum, t) => sum + t.price * t.quantity + t.fee + t.tax, 0);
      const sellRevenue = sellTxns.reduce((sum, t) => sum + t.price * t.quantity - t.fee - t.tax, 0);
      const avgBuyCost = buyQty > 0 ? buyCost / buyQty : 0;

      const result: AssetDetail = {
        asset,
        transactions,
        tags,
        summary: {
          totalBuyQuantity: buyQty,
          totalSellQuantity: sellQty,
          holdingQuantity: holding,
          totalBuyCost: buyCost,
          totalSellRevenue: sellRevenue,
          avgBuyCost: avgBuyCost,
        },
      };

      return reply.send(result);
    }
  );

  // PATCH /api/assets/:id - Update asset
  app.patch<{ Params: { id: string }; Body: UpdateAsset; Reply: Asset | { error: string } }>(
    '/assets/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的资产ID' });
      }

      const data = request.body;
      const database = db.getUserDatabase(userId);
      const idx = database.assets.findIndex((a) => a.id === id);

      if (idx === -1) {
        return reply.code(404).send({ error: `资产 ${id} 不存在` });
      }

      if (data.name !== undefined) database.assets[idx].name = data.name;
      if (data.symbol !== undefined) database.assets[idx].symbol = data.symbol;
      if (data.asset_type !== undefined) database.assets[idx].asset_type = data.asset_type;
      if (data.currency !== undefined) database.assets[idx].currency = data.currency;
      database.assets[idx].updated_at = new Date().toISOString();

      // Update tags if provided
      if (data.tag_ids !== undefined) {
        database.asset_tags = database.asset_tags.filter((at) => at.asset_id !== id);
        for (const tagId of data.tag_ids) {
          if (tagExists(userId, tagId)) {
            database.asset_tags.push({ asset_id: id, tag_id: tagId });
          }
        }
      }

      await db.persistUserDatabase(userId);
      return reply.send(database.assets[idx]);
    }
  );

  // DELETE /api/assets/:id - Delete asset
  app.delete<{ Params: { id: string }; Reply: { success: boolean } | { error: string } }>(
    '/assets/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的资产ID' });
      }

      const database = db.getUserDatabase(userId);
      const before = database.assets.length;
      database.assets = database.assets.filter((a) => a.id !== id);

      if (database.assets.length === before) {
        return reply.code(404).send({ error: `资产 ${id} 不存在` });
      }

      database.transactions = database.transactions.filter((t) => t.asset_id !== id);
      database.asset_tags = database.asset_tags.filter((at) => at.asset_id !== id);

      await db.persistUserDatabase(userId);
      return reply.send({ success: true });
    }
  );

  // POST /api/assets/:id/tags - Add tag to asset
  app.post<{ Params: { id: string }; Body: { tag_id: number }; Reply: { success: boolean } | { error: string } }>(
    '/assets/:id/tags',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const assetId = parseInt(request.params.id, 10);
      if (isNaN(assetId)) {
        return reply.code(400).send({ error: '无效的资产ID' });
      }

      const tagId = request.body?.tag_id;
      if (tagId === undefined || isNaN(tagId)) {
        return reply.code(400).send({ error: 'tag_id 不能为空' });
      }

      const database = db.getUserDatabase(userId);

      if (!database.assets.some((a) => a.id === assetId)) {
        return reply.code(404).send({ error: `资产 ${assetId} 不存在` });
      }
      if (!tagExists(userId, tagId)) {
        return reply.code(404).send({ error: `标签 ${tagId} 不存在` });
      }

      if (!database.asset_tags.some((at) => at.asset_id === assetId && at.tag_id === tagId)) {
        database.asset_tags.push({ asset_id: assetId, tag_id: tagId });
        await db.persistUserDatabase(userId);
      }

      return reply.send({ success: true });
    }
  );

  // DELETE /api/assets/:id/tags/:tagId - Remove tag from asset
  app.delete<{ Params: { id: string; tagId: string }; Reply: { success: boolean } | { error: string } }>(
    '/assets/:id/tags/:tagId',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const assetId = parseInt(request.params.id, 10);
      const tagId = parseInt(request.params.tagId, 10);

      if (isNaN(assetId) || isNaN(tagId)) {
        return reply.code(400).send({ error: '无效的ID' });
      }

      const database = db.getUserDatabase(userId);
      const before = database.asset_tags.length;
      database.asset_tags = database.asset_tags.filter(
        (at) => !(at.asset_id === assetId && at.tag_id === tagId)
      );

      if (database.asset_tags.length === before) {
        return reply.code(404).send({ error: `资产 ${assetId} 上没有标签 ${tagId}` });
      }

      await db.persistUserDatabase(userId);
      return reply.send({ success: true });
    }
  );
}
