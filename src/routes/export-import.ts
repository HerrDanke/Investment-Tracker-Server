import type { FastifyInstance } from 'fastify';
import type { Database } from '../types';

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

export default async function exportImportRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/export - Export all data
  app.get('/export', { onRequest: [app.authenticate] }, async (request, reply) => {
    const database = db.getDatabase();
    // Use the same serialization format as data.json (camelCase)
    const output = {
      assets: database.assets.map(a => ({
        id: a.id,
        name: a.name,
        symbol: a.symbol ?? '',
        type: a.asset_type,
        currency: a.currency,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      transactions: database.transactions.map(t => ({
        id: t.id,
        assetId: t.asset_id,
        type: t.txn_type,
        date: t.date,
        price: t.price,
        quantity: t.quantity,
        fee: t.fee,
        tax: t.tax,
        currency: t.currency,
        notes: t.notes ?? '',
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
      tags: database.tags,
      assetTags: database.asset_tags.map(at => ({
        assetId: at.asset_id,
        tagId: at.tag_id,
      })),
      _seq: database._seq,
    };
    const json = JSON.stringify(output, null, 2);
    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename="data-export.json"')
      .send(json);
  });

  // POST /api/import - Import data (overwrite mode)
  app.post<{ Body: string; Reply: { success: boolean } | { error: string } }>(
    '/import',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);

      // Check size limit
      const bodySize = Buffer.byteLength(body, 'utf-8');
      if (bodySize > MAX_IMPORT_SIZE) {
        return reply.code(413).send({ error: '导入文件过大，最大支持 10MB' });
      }

      let imported: Database;
      try {
        imported = JSON.parse(body);
      } catch (e: any) {
        return reply.code(400).send({ error: `JSON 格式无效: ${e.message}` });
      }

      // Validate data structure
      if (!imported.assets || !Array.isArray(imported.assets)) {
        return reply.code(400).send({ error: '数据格式无效: 缺少 assets 数组' });
      }
      if (!imported.transactions || !Array.isArray(imported.transactions)) {
        return reply.code(400).send({ error: '数据格式无效: 缺少 transactions 数组' });
      }
      if (!imported.tags || !Array.isArray(imported.tags)) {
        return reply.code(400).send({ error: '数据格式无效: 缺少 tags 数组' });
      }
      if (imported.assets.length > 10000 || imported.transactions.length > 100000 || imported.tags.length > 1000) {
        return reply.code(400).send({ error: '数据量超出合理范围' });
      }

      // Normalize imported data (handle camelCase)
      const normalizedDb: Database = {
        assets: imported.assets.map((a: any) => ({
          id: a.id,
          name: a.name,
          symbol: a.symbol ?? null,
          asset_type: a.asset_type ?? a.type ?? 'stock',
          currency: a.currency ?? 'EUR',
          created_at: a.created_at ?? a.createdAt ?? new Date().toISOString(),
          updated_at: a.updated_at ?? a.updatedAt ?? new Date().toISOString(),
        })),
        transactions: imported.transactions.map((t: any) => ({
          id: t.id,
          asset_id: t.asset_id ?? t.assetId ?? 0,
          txn_type: t.txn_type ?? t.txnType ?? t.type ?? 'buy',
          date: t.date,
          price: t.price ?? 0,
          quantity: t.quantity ?? 0,
          fee: t.fee ?? 0,
          tax: t.tax ?? 0,
          currency: t.currency ?? 'EUR',
          notes: t.notes ?? null,
          created_at: t.created_at ?? t.createdAt ?? new Date().toISOString(),
          updated_at: t.updated_at ?? t.updatedAt ?? new Date().toISOString(),
        })),
        tags: imported.tags,
        asset_tags: (imported.asset_tags ?? (imported as any).assetTags ?? []).map((at: any) => ({
          asset_id: at.asset_id ?? at.assetId ?? 0,
          tag_id: at.tag_id ?? at.tagId ?? 0,
        })),
        _seq: imported._seq ?? { assets: 0, transactions: 0, tags: 0 },
      };

      await db.updateDatabase(normalizedDb);
      return reply.send({ success: true });
    }
  );
}
