import { promises as fs } from 'fs';
import path from 'path';
import type { Database, Asset, Transaction, Tag, AssetTag, Sequence, User } from './types';

// Default empty database
function createDefaultDatabase(): Database {
  return {
    assets: [],
    transactions: [],
    tags: [],
    asset_tags: [],
    _seq: { assets: 0, transactions: 0, tags: 0 },
  };
}

// Parse database from JSON string with field alias support
function parseDatabase(json: string): Database {
  const raw = JSON.parse(json);
  
  // Normalize assets - handle both camelCase and snake_case from data.json
  const assets: Asset[] = (raw.assets || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    symbol: a.symbol ?? null,
    asset_type: a.asset_type ?? a.type ?? 'stock',
    currency: a.currency ?? 'EUR',
    created_at: a.created_at ?? a.createdAt ?? new Date().toISOString(),
    updated_at: a.updated_at ?? a.updatedAt ?? new Date().toISOString(),
  }));

  // Normalize transactions
  const transactions: Transaction[] = (raw.transactions || []).map((t: any) => ({
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
  }));

  // Normalize tags
  const tags: Tag[] = (raw.tags || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    category: t.category ?? 'custom',
    color: t.color ?? '#6B7280',
  }));

  // Normalize asset_tags
  const asset_tags: AssetTag[] = (raw.asset_tags ?? raw.assetTags ?? []).map((at: any) => ({
    asset_id: at.asset_id ?? at.assetId ?? 0,
    tag_id: at.tag_id ?? at.tagId ?? 0,
  }));

  // Normalize _seq
  const seq: Sequence = {
    assets: raw._seq?.assets ?? 0,
    transactions: raw._seq?.transactions ?? 0,
    tags: raw._seq?.tags ?? 0,
  };

  return { assets, transactions, tags, asset_tags, _seq: seq };
}

// Serialize database to JSON (preserving original data.json format)
function serializeDatabase(db: Database): string {
  // Output in the same format as the original data.json (camelCase for some fields)
  const output = {
    assets: db.assets.map(a => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol ?? '',
      type: a.asset_type,
      currency: a.currency,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })),
    transactions: db.transactions.map(t => ({
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
    tags: db.tags,
    assetTags: db.asset_tags.map(at => ({
      assetId: at.asset_id,
      tagId: at.tag_id,
    })),
    _seq: db._seq,
  };
  return JSON.stringify(output, null, 2);
}

// Database class with file-based persistence
class DatabaseManager {
  private db: Database;
  private users: User[] = [];
  private dataPath: string;
  private usersPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dataDir: string) {
    this.dataPath = path.join(dataDir, 'data.json');
    this.usersPath = path.join(dataDir, 'users.json');
    this.db = createDefaultDatabase();
  }

  async init(): Promise<void> {
    // Load database
    try {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      if (content.trim()) {
        this.db = parseDatabase(content);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to load data.json:', err);
      }
      // Create default database file
      await this.persist();
    }

    // Load users
    try {
      const content = await fs.readFile(this.usersPath, 'utf-8');
      if (content.trim()) {
        this.users = JSON.parse(content);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to load users.json:', err);
      }
      await this.persistUsers();
    }
  }

  // Get database (for read operations)
  getDatabase(): Database {
    return this.db;
  }

  // Get users
  getUsers(): User[] {
    return this.users;
  }

  // Update database and persist
  async updateDatabase(newDb: Database): Promise<void> {
    this.db = newDb;
    await this.persist();
  }

  // Update users and persist
  async updateUsers(newUsers: User[]): Promise<void> {
    this.users = newUsers;
    await this.persistUsers();
  }

  // Persist database to file (atomic write via temp file)
  private async persist(): Promise<void> {
    const json = serializeDatabase(this.db);
    // Queue writes to prevent race conditions
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = this.dataPath + '.tmp';
      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(tmpPath, this.dataPath);
    });
    return this.writeQueue;
  }

  // Persist users to file
  private async persistUsers(): Promise<void> {
    const json = JSON.stringify(this.users, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = this.usersPath + '.tmp';
      await fs.writeFile(tmpPath, json, 'utf-8');
      await fs.rename(tmpPath, this.usersPath);
    });
    return this.writeQueue;
  }

  // Generate next asset ID
  nextAssetId(): number {
    this.db._seq.assets += 1;
    return this.db._seq.assets;
  }

  // Generate next transaction ID
  nextTransactionId(): number {
    this.db._seq.transactions += 1;
    return this.db._seq.transactions;
  }

  // Generate next tag ID
  nextTagId(): number {
    this.db._seq.tags += 1;
    return this.db._seq.tags;
  }
}

export { DatabaseManager };
