import { promises as fs, readFileSync } from 'fs';
import argon2 from 'argon2';
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

// Serialize database to JSON (output format matches frontend expectations)
export function serializeDatabase(db: Database): string {
  const output = {
    assets: db.assets.map(a => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol ?? null,
      asset_type: a.asset_type,
      currency: a.currency,
      created_at: a.created_at,
      updated_at: a.updated_at,
    })),
    transactions: db.transactions.map(t => ({
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
    tags: db.tags,
    asset_tags: db.asset_tags.map(at => ({
      asset_id: at.asset_id,
      tag_id: at.tag_id,
    })),
    _seq: db._seq,
  };
  return JSON.stringify(output, null, 2);
}

// Default system tags (shared across all users)
function createDefaultSystemTags(): Tag[] {
  return [
    { id: 1, name: 'A股', category: 'system', color: '#EF4444' },
    { id: 2, name: '宽基指数', category: 'system', color: '#8B5CF6' },
    { id: 3, name: '港股', category: 'system', color: '#F59E0B' },
    { id: 4, name: '基金', category: 'system', color: '#3B82F6' },
    { id: 5, name: '美股', category: 'system', color: '#10B981' },
    { id: 6, name: '债券', category: 'system', color: '#6366F1' },
    { id: 7, name: '加密货币', category: 'system', color: '#F97316' },
    { id: 8, name: 'ETF', category: 'system', color: '#14B8A6' },
    { id: 9, name: '股票', category: 'system', color: '#EC4899' },
  ];
}

// Database class with per-user file-based persistence
class DatabaseManager {
  private users: User[] = [];
  private userDbs = new Map<string, Database>();
  private systemTags: Tag[] = [];
  private dataDir: string;
  private usersPath: string;
  private systemTagsPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.usersPath = path.join(dataDir, 'users.json');
    this.systemTagsPath = path.join(dataDir, 'system-tags.json');
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });

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

    // Load system tags
    try {
      const content = await fs.readFile(this.systemTagsPath, 'utf-8');
      if (content.trim()) {
        this.systemTags = JSON.parse(content);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to load system-tags.json:', err);
      }
    }

    // Migrate legacy shared data file
    await this.migrateLegacyData();

    // Ensure system tags exist
    if (this.systemTags.length === 0) {
      this.systemTags = createDefaultSystemTags();
      await this.persistSystemTags();
    }

    // Ensure default admin user exists
    await this.ensureAdminUser();

    // Fix tag ID collisions in existing user data
    await this.fixTagIdCollisions();
  }

  // ---- Fix tag ID collisions in existing user data ----
  private async fixTagIdCollisions(): Promise<void> {
    const maxSystemTagId = this.systemTags.length > 0 ? Math.max(...this.systemTags.map(t => t.id)) : 9;
    let fixed = false;

    for (const userId of this.userDbs.keys()) {
      const db = this.userDbs.get(userId)!;
      if (!db || db.tags.length === 0) continue;

      // Check for collisions: custom tags with ID <= maxSystemTagId
      const hasCollision = db.tags.some(t => t.id <= maxSystemTagId);
      if (!hasCollision) continue;

      // Remap colliding custom tag IDs
      let nextId = maxSystemTagId + 1;
      const idMap = new Map<number, number>();
      for (const tag of db.tags) {
        if (tag.id <= maxSystemTagId) {
          idMap.set(tag.id, nextId);
          tag.id = nextId;
          nextId++;
        }
      }

      // Update asset_tags references
      for (const at of db.asset_tags) {
        if (idMap.has(at.tag_id)) {
          at.tag_id = idMap.get(at.tag_id)!;
        }
      }

      // Update _seq.tags if needed
      if (db._seq.tags <= maxSystemTagId) {
        db._seq.tags = nextId - 1;
      }

      await this.persistUserDatabase(userId);
      fixed = true;
    }

    if (fixed) {
      console.log('Fixed tag ID collisions in user data');
    }
  }

  // ---- User database file path ----
  private userDbPath(userId: string): string {
    return path.join(this.dataDir, `data-${userId}.json`);
  }

  // ---- Get user-specific database (lazy load, returns cached reference) ----
  getUserDatabase(userId: string): Database {
    const cached = this.userDbs.get(userId);
    if (cached) return cached;
    const db = this.loadUserDatabase(userId);
    this.userDbs.set(userId, db);
    return db;
  }

  private loadUserDatabase(userId: string): Database {
    try {
      const content = readFileSync(this.userDbPath(userId), 'utf-8');
      if (content.trim()) {
        return parseDatabase(content);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to load data for user ${userId}:`, err);
      }
    }
    return createDefaultDatabase();
  }

  // ---- Persist user database ----
  async persistUserDatabase(userId: string): Promise<void> {
    const db = this.userDbs.get(userId);
    if (!db) throw new Error(`No database cached for user ${userId}`);
    const json = serializeDatabase(db);
    await this.writeAtomically(this.userDbPath(userId), json);
  }

  // ---- Atomic write (shared write queue for serialization) ----
  private async writeAtomically(filePath: string, content: string): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const tmpPath = filePath + '.tmp';
      await fs.writeFile(tmpPath, content, 'utf-8');
      await fs.rename(tmpPath, filePath);
    });
    return this.writeQueue;
  }

  // ---- Users management ----
  getUsers(): User[] {
    return this.users;
  }

  async updateUsers(newUsers: User[]): Promise<void> {
    this.users = newUsers;
    await this.persistUsers();
  }

  private async persistUsers(): Promise<void> {
    const json = JSON.stringify(this.users, null, 2);
    await this.writeAtomically(this.usersPath, json);
  }


  // ---- Default admin user ----
  // Ensures a default admin account exists on startup.
  // ADMIN_USERNAME (default: admin) and ADMIN_PASSWORD (default: admin123) control the credentials.
  // If the admin user already exists, its password is NOT changed.
  async ensureAdminUser(): Promise<void> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = this.users.find((u) => u.username === adminUsername);
    if (existing) return; // Admin already exists — don't overwrite password

    const passwordHash = await argon2.hash(adminPassword);
    const now = new Date().toISOString();
    const adminUser: User = {
      id: crypto.randomUUID(),
      username: adminUsername,
      password_hash: passwordHash,
      created_at: now,
    };
    this.users.push(adminUser);
    await this.persistUsers();
    console.log(`Created default admin user "${adminUsername}"`);
  }

  // ---- System tags management ----
  getSystemTags(): Tag[] {
    return this.systemTags;
  }

  // Get all tags visible to a user (system + custom)
  getAllTagsForUser(userId: string): Tag[] {
    const userDb = this.getUserDatabase(userId);
    return [...this.systemTags, ...userDb.tags];
  }

  // Find a tag by ID across system and user tags
  findTagById(userId: string, tagId: number): { tag: Tag; isSystem: boolean } | null {
    const systemTag = this.systemTags.find(t => t.id === tagId);
    if (systemTag) return { tag: systemTag, isSystem: true };
    const userDb = this.getUserDatabase(userId);
    const customTag = userDb.tags.find(t => t.id === tagId);
    if (customTag) return { tag: customTag, isSystem: false };
    return null;
  }

  async createSystemTag(tag: Tag): Promise<void> {
    this.systemTags.push(tag);
    await this.persistSystemTags();
  }

  async updateSystemTag(tagId: number, updates: Partial<Pick<Tag, 'name' | 'color'>>): Promise<boolean> {
    const tag = this.systemTags.find(t => t.id === tagId);
    if (!tag) return false;
    if (updates.name !== undefined) tag.name = updates.name;
    if (updates.color !== undefined) tag.color = updates.color;
    await this.persistSystemTags();
    return true;
  }

  async deleteSystemTag(tagId: number): Promise<boolean> {
    const before = this.systemTags.length;
    this.systemTags = this.systemTags.filter(t => t.id !== tagId);
    if (this.systemTags.length === before) return false;
    await this.persistSystemTags();
    return true;
  }

  private async persistSystemTags(): Promise<void> {
    const json = JSON.stringify(this.systemTags, null, 2);
    await this.writeAtomically(this.systemTagsPath, json);
  }

  // ---- ID generation (per-user scope) ----
  nextAssetId(userId: string): number {
    const db = this.getUserDatabase(userId);
    db._seq.assets += 1;
    return db._seq.assets;
  }

  nextTransactionId(userId: string): number {
    const db = this.getUserDatabase(userId);
    db._seq.transactions += 1;
    return db._seq.transactions;
  }

  nextTagId(userId: string): number {
    const db = this.getUserDatabase(userId);
    db._seq.tags += 1;
    // Ensure custom tag IDs don't collide with system tags (1-9)
    const maxSystemTagId = this.systemTags.length > 0 ? Math.max(...this.systemTags.map(t => t.id)) : 9;
    if (db._seq.tags <= maxSystemTagId) {
      db._seq.tags = maxSystemTagId + 1;
    }
    return db._seq.tags;
  }

  // ---- Data directory accessor ----
  getDataDir(): string {
    return this.dataDir;
  }


  // ---- Admin helpers ----
  // Determine if a user is the admin. Admin is the user whose username matches
  // the ADMIN_USERNAME env var. If that user doesn't exist yet, the first
  // registered user is admin (graceful fallback for fresh deploys).
  isAdmin(userId: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    const adminUsername = process.env.ADMIN_USERNAME;
    if (adminUsername) {
      const adminUser = this.users.find((u) => u.username === adminUsername);
      if (adminUser) return adminUser.id === userId;
      // Admin user not yet registered — first user is admin
      return this.users.length > 0 && this.users[0].id === userId;
    }
    // No ADMIN_USERNAME set — first registered user is admin
    return this.users.length > 0 && this.users[0].id === userId;
  }

  // List all users (safe summary without password hashes, with admin flag)
  listUsers(): { id: string; username: string; created_at: string; isAdmin: boolean }[] {
    return this.users.map((u) => ({
      id: u.id,
      username: u.username,
      created_at: u.created_at,
      isAdmin: this.isAdmin(u.id),
    }));
  }

  // Delete a user and all their data files. Returns false if not found.
  async deleteUser(userId: string): Promise<boolean> {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    const target = this.users[idx];
    // Prevent deleting the admin account
    if (this.isAdmin(userId)) {
      throw new Error('不能删除管理员账户');
    }

    // Remove user from list
    this.users.splice(idx, 1);
    await this.persistUsers();

    // Remove from cache
    this.userDbs.delete(userId);

    // Delete user data file
    try {
      await fs.unlink(this.userDbPath(userId));
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error(`Failed to delete data file for user ${userId}:`, err);
      }
    }

    // Delete user backups
    try {
      const files = await fs.readdir(this.dataDir);
      const backups = files.filter((f) => f.startsWith(`data-${userId}-backup-`));
      for (const f of backups) {
        await fs.unlink(path.join(this.dataDir, f));
      }
    } catch (err: any) {
      console.error(`Failed to delete backups for user ${userId}:`, err);
    }

    return true;
  }

  // ---- Legacy data migration ----
  private async migrateLegacyData(): Promise<void> {
    // No users or no legacy file → nothing to migrate
    if (this.users.length === 0) return;

    const legacyPath = path.join(this.dataDir, 'data.json');
    let content: string;
    try {
      content = await fs.readFile(legacyPath, 'utf-8');
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        console.error('Failed to read legacy data.json:', err);
      }
      return; // No legacy file, nothing to migrate
    }

    const adminUser = this.users[0];
    const targetPath = this.userDbPath(adminUser.id);

    // If admin already has a data file, just archive the legacy file
    try {
      await fs.access(targetPath);
      await fs.rename(legacyPath, `${legacyPath}.archived-${Date.now()}`);
      console.log(`Per-user data exists for ${adminUser.username}; archived legacy data.json`);
      return;
    } catch {
      // Target file doesn't exist, safe to migrate
    }

    // Parse legacy data and separate system tags from custom tags
    const legacyDb = content.trim() ? parseDatabase(content) : createDefaultDatabase();

    // Extract system tags to system-tags.json if not already present
    const systemTagsFromLegacy = legacyDb.tags.filter(t => t.category === 'system');
    if (systemTagsFromLegacy.length > 0 && this.systemTags.length === 0) {
      this.systemTags = systemTagsFromLegacy;
      await this.persistSystemTags();
    }

    // Keep only custom tags in the user's database
    const customTags = legacyDb.tags.filter(t => t.category !== 'system');

    // Remap custom tag IDs to avoid conflicts with system tags (start after max system tag ID)
    const maxSystemTagId = this.systemTags.length > 0 ? Math.max(...this.systemTags.map(t => t.id)) : 9;
    const tagIdMap = new Map<number, number>();
    let nextCustomId = maxSystemTagId + 1;
    for (const tag of customTags) {
      tagIdMap.set(tag.id, nextCustomId);
      tag.id = nextCustomId;
      nextCustomId++;
    }

    // Update asset_tags references for custom tags
    const migratedDb: Database = {
      assets: legacyDb.assets,
      transactions: legacyDb.transactions,
      tags: customTags,
      asset_tags: legacyDb.asset_tags.map(at => ({
        asset_id: at.asset_id,
        tag_id: tagIdMap.get(at.tag_id) ?? at.tag_id, // system tag IDs stay the same
      })),
      _seq: {
        assets: legacyDb._seq.assets,
        transactions: legacyDb._seq.transactions,
        tags: customTags.length > 0 ? Math.max(...customTags.map(t => t.id)) : 0,
      },
    };

    // Cache and persist admin's data
    this.userDbs.set(adminUser.id, migratedDb);
    await this.persistUserDatabase(adminUser.id);

    // Archive legacy file
    await fs.rename(legacyPath, `${legacyPath}.migrated-${Date.now()}`);
    console.log(`Migrated legacy data.json to user ${adminUser.username} (${adminUser.id})`);
  }
}

export { DatabaseManager };
