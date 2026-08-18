import type { FastifyInstance } from 'fastify';
import type { Transaction, CreateTransaction, UpdateTransaction, TransactionWithAsset } from '../types';

const VALID_TXN_TYPES = ['buy', 'sell', 'dividend'];

export default async function transactionRoutes(app: FastifyInstance) {
  const db = app.db;

  // GET /api/transactions - List transactions with optional filters and pagination
  app.get<{ Querystring: { assetId?: string; asset_id?: string; type?: string; txn_type?: string; txnType?: string; startDate?: string; start_date?: string; endDate?: string; end_date?: string; page?: string; page_size?: string }; Reply: { data: TransactionWithAsset[]; total: number; page: number; page_size: number; total_pages: number } }>(
    '/transactions',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const q = request.query;
      const database = db.getUserDatabase(userId);
      let txns = [...database.transactions];

      // Support both camelCase and snake_case query params
      const assetId = q.asset_id ?? q.assetId;
      const txnType = q.txn_type ?? q.txnType ?? q.type;
      const startDate = q.start_date ?? q.startDate;
      const endDate = q.end_date ?? q.endDate;

      // Apply filters
      if (assetId !== undefined) {
        const aid = parseInt(assetId, 10);
        if (!isNaN(aid)) txns = txns.filter((t) => t.asset_id === aid);
      }
      if (txnType !== undefined) {
        txns = txns.filter((t) => t.txn_type === txnType);
      }
      if (startDate !== undefined) {
        txns = txns.filter((t) => t.date >= startDate);
      }
      if (endDate !== undefined) {
        txns = txns.filter((t) => t.date <= endDate);
      }

      // Sort by date descending (newest first)
      txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      // Pagination
      const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
      const pageSize = Math.max(1, parseInt(q.page_size || '20', 10) || 20);
      const total = txns.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const offset = (safePage - 1) * pageSize;
      const paginated = txns.slice(offset, offset + pageSize);

      const data: any[] = paginated.map((t) => {
        const asset = database.assets.find((a) => a.id === t.asset_id) ?? null;
        return { ...t, asset };
      });

      return reply.send({ data, total, page: safePage, page_size: pageSize, total_pages: totalPages });
    }
  );

  // POST /api/transactions - Create transaction
  app.post<{ Body: CreateTransaction; Reply: Transaction | { error: string } }>(
    '/transactions',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const data = request.body;

      // Validate transaction type
      if (!data.txn_type || !VALID_TXN_TYPES.includes(data.txn_type)) {
        return reply.code(400).send({ error: `无效的交易类型: ${data.txn_type}。必须是: buy, sell, dividend` });
      }

      // Validate price
      if (typeof data.price !== 'number' || !isFinite(data.price) || data.price < 0) {
        return reply.code(400).send({ error: '价格必须为非负数' });
      }

      // Validate quantity
      if (typeof data.quantity !== 'number' || !isFinite(data.quantity) || data.quantity <= 0) {
        return reply.code(400).send({ error: '数量必须为正数' });
      }

      // Validate fee
      if (data.fee !== undefined && (typeof data.fee !== 'number' || !isFinite(data.fee) || data.fee < 0)) {
        return reply.code(400).send({ error: '手续费必须为非负数' });
      }

      // Validate tax
      if (data.tax !== undefined && (typeof data.tax !== 'number' || !isFinite(data.tax) || data.tax < 0)) {
        return reply.code(400).send({ error: '税费必须为非负数' });
      }

      const database = db.getUserDatabase(userId);

      // Verify asset exists
      if (!database.assets.some((a) => a.id === data.asset_id)) {
        return reply.code(404).send({ error: `资产 ${data.asset_id} 不存在` });
      }

      const id = db.nextTransactionId(userId);
      const now = new Date().toISOString();

      const txn: Transaction = {
        id,
        asset_id: data.asset_id,
        txn_type: data.txn_type,
        date: data.date,
        price: data.price,
        quantity: data.quantity,
        fee: data.fee ?? 0,
        tax: data.tax ?? 0,
        currency: data.currency ?? 'EUR',
        notes: data.notes ?? null,
        created_at: now,
        updated_at: now,
      };

      database.transactions.push(txn);
      await db.persistUserDatabase(userId);

      return reply.code(201).send(txn);
    }
  );

  // GET /api/transactions/:id - Get transaction detail
  app.get<{ Params: { id: string }; Reply: TransactionWithAsset | { error: string } }>(
    '/transactions/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的交易ID' });
      }

      const database = db.getUserDatabase(userId);
      const txn = database.transactions.find((t) => t.id === id);

      if (!txn) {
        return reply.code(404).send({ error: `交易 ${id} 不存在` });
      }

      const asset = database.assets.find((a) => a.id === txn.asset_id) ?? null;
      return reply.send({ ...txn, asset });
    }
  );

  // PATCH /api/transactions/:id - Update transaction
  app.patch<{ Params: { id: string }; Body: UpdateTransaction; Reply: Transaction | { error: string } }>(
    '/transactions/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的交易ID' });
      }

      const data = request.body;
      const database = db.getUserDatabase(userId);
      const txn = database.transactions.find((t) => t.id === id);

      if (!txn) {
        return reply.code(404).send({ error: `交易 ${id} 不存在` });
      }

      // Validate transaction type if provided
      if (data.txn_type !== undefined && !VALID_TXN_TYPES.includes(data.txn_type)) {
        return reply.code(400).send({ error: `无效的交易类型: ${data.txn_type}` });
      }

      // Validate price if provided
      if (data.price !== undefined && (typeof data.price !== 'number' || !isFinite(data.price) || data.price < 0)) {
        return reply.code(400).send({ error: '价格必须为非负数' });
      }

      // Validate quantity if provided
      if (data.quantity !== undefined && (typeof data.quantity !== 'number' || !isFinite(data.quantity) || data.quantity <= 0)) {
        return reply.code(400).send({ error: '数量必须为正数' });
      }

      if (data.asset_id !== undefined) txn.asset_id = data.asset_id;
      if (data.txn_type !== undefined) txn.txn_type = data.txn_type;
      if (data.date !== undefined) txn.date = data.date;
      if (data.price !== undefined) txn.price = data.price;
      if (data.quantity !== undefined) txn.quantity = data.quantity;
      if (data.fee !== undefined) txn.fee = data.fee;
      if (data.tax !== undefined) txn.tax = data.tax;
      if (data.currency !== undefined) txn.currency = data.currency;
      if (data.notes !== undefined) txn.notes = data.notes;
      txn.updated_at = new Date().toISOString();

      await db.persistUserDatabase(userId);
      return reply.send(txn);
    }
  );

  // DELETE /api/transactions/:id - Delete transaction
  app.delete<{ Params: { id: string }; Reply: { success: boolean } | { error: string } }>(
    '/transactions/:id',
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const id = parseInt(request.params.id, 10);
      if (isNaN(id)) {
        return reply.code(400).send({ error: '无效的交易ID' });
      }

      const database = db.getUserDatabase(userId);
      const before = database.transactions.length;
      database.transactions = database.transactions.filter((t) => t.id !== id);

      if (database.transactions.length === before) {
        return reply.code(404).send({ error: `交易 ${id} 不存在` });
      }

      await db.persistUserDatabase(userId);
      return reply.send({ success: true });
    }
  );
}
