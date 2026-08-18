import type { FastifyInstance } from 'fastify';
import type { Database } from '../types';
import { promises as fs } from 'fs';
import path from 'path';
import { serializeDatabase } from '../db';

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

export default async function exportImportRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/export - Export current user's data
  app.get('/export', { onRequest: [app.authenticate] }, async (request, reply) => {
    const userId = request.user!.sub;
    const database = db.getUserDatabase(userId);
    // Include system tags that are referenced by this user's assets
    // so the export file is self-contained and Tauri-compatible
    const referencedSystemTagIds = new Set(
      database.asset_tags
        .map(at => db.findTagById(userId, at.tag_id))
        .filter(t => t?.isSystem)
        .map(t => t!.tag.id)
    );
    const referencedSystemTags = db.getSystemTags().filter(t => referencedSystemTagIds.has(t.id));

    // Output in snake_case format (matches Tauri desktop expectations)
    const output = {
      assets: database.assets.map(a => ({
        id: a.id,
        name: a.name,
        symbol: a.symbol ?? null,
        asset_type: a.asset_type,
        currency: a.currency,
        created_at: a.created_at,
        updated_at: a.updated_at,
      })),
      transactions: database.transactions.map(t => ({
        id: t.id,
        asset_id: t.asset_id,
        txn_type: t.txn_type,
        date: t.date,
        price: t.price,
        quantity: t.quantity,
        fee: t.fee,
        tax: t.tax,
        currency: t.currency,
        notes: t.notes ?? null,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })),
      tags: [...referencedSystemTags, ...database.tags], // System tags (referenced) + custom tags
      asset_tags: database.asset_tags.map(at => ({
        asset_id: at.asset_id,
        tag_id: at.tag_id,
      })),
      _seq: database._seq,
    };
    const json = JSON.stringify(output, null, 2);
    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename="data-export.json"')
      .send(json);
  });

  // POST /api/import - Import data (overwrite current user's data)
  app.post<{ Body: string; Reply: { success: boolean } | { error: string } }>(
    '/import',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
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
        // Filter out system tags from import — they are managed globally
        tags: imported.tags.filter((t: any) => t.category !== 'system'),
        asset_tags: (imported.asset_tags ?? (imported as any).assetTags ?? []).map((at: any) => ({
          asset_id: at.asset_id ?? at.assetId ?? 0,
          tag_id: at.tag_id ?? at.tagId ?? 0,
        })),
        _seq: imported._seq ?? { assets: 0, transactions: 0, tags: 0 },
      };

      // Create per-user backup before overwriting
      try {
        const dataDir = db.getDataDir();
        const backupPath = path.join(dataDir, `data-${userId}-backup-${Date.now()}.json`);
        const currentData = serializeDatabase(db.getUserDatabase(userId));
        await fs.writeFile(backupPath, currentData, 'utf-8');
        // Keep only last 5 backups per user
        const files = await fs.readdir(dataDir);
        const backups = files.filter(f => f.startsWith(`data-${userId}-backup-`)).sort();
        while (backups.length > 5) {
          const oldest = backups.shift();
          if (oldest) await fs.unlink(path.join(dataDir, oldest));
        }
      } catch (backupErr: any) {
        console.warn('Failed to create backup before import:', backupErr.message);
      }

      // Replace current user's data
      const userDb = db.getUserDatabase(userId);
      userDb.assets = normalizedDb.assets;
      userDb.transactions = normalizedDb.transactions;
      userDb.tags = normalizedDb.tags;
      userDb.asset_tags = normalizedDb.asset_tags;
      userDb._seq = normalizedDb._seq;
      await db.persistUserDatabase(userId);

      return reply.send({ success: true });
    }
  );
}
