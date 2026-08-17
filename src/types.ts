// ==================== CORE DATA MODELS ====================

export interface Asset {
  id: number;
  name: string;
  symbol: string | null;
  asset_type: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AssetWithTags extends Asset {
  tags: Tag[];
}

export interface Transaction {
  id: number;
  asset_id: number;
  txn_type: string;
  date: string;
  price: number;
  quantity: number;
  fee: number;
  tax: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithAsset {
  transaction: Transaction;
  asset: Asset | null;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  color: string;
}

export interface AssetTag {
  asset_id: number;
  tag_id: number;
}

export interface Sequence {
  assets: number;
  transactions: number;
  tags: number;
}

export interface Database {
  assets: Asset[];
  transactions: Transaction[];
  tags: Tag[];
  asset_tags: AssetTag[];
  _seq: Sequence;
}

// ==================== AUTH MODELS ====================

export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  password_confirm: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  exp: number;
}

// ==================== DTOs ====================

export interface CreateAsset {
  name: string;
  symbol?: string | null;
  asset_type?: string;
  currency?: string;
  tag_ids?: number[];
}

export interface UpdateAsset {
  name?: string;
  symbol?: string | null;
  asset_type?: string;
  currency?: string;
  tag_ids?: number[];
}

export interface CreateTransaction {
  asset_id: number;
  txn_type: string;
  date: string;
  price: number;
  quantity: number;
  fee?: number;
  tax?: number;
  currency?: string;
  notes?: string | null;
}

export interface UpdateTransaction {
  asset_id?: number;
  txn_type?: string;
  date?: string;
  price?: number;
  quantity?: number;
  fee?: number;
  tax?: number;
  currency?: string;
  notes?: string | null;
}

export interface CreateTag {
  name: string;
  category?: string;
  color?: string;
}

export interface UpdateTag {
  name?: string;
  category?: string;
  color?: string;
}

export interface TransactionQuery {
  asset_id?: number;
  txn_type?: string;
  start_date?: string;
  end_date?: string;
}

// ==================== SUMMARY MODELS ====================

export interface AssetSummary {
  id: number;
  name: string;
  symbol: string | null;
  asset_type: string;
  currency: string;
  holding: number;
  buy_cost: number;
  sell_revenue: number;
  avg_buy_cost: number;
  holding_cost_basis: number;
  realized_pnl: number | null;
  tags: Tag[];
}

export interface Overview {
  total_assets: number;
  total_investment: number;
  total_realized_pnl: number;
  total_dividends: number;
  total_fees: number;
  total_tax: number;
  cost_basis_of_holdings: number;
}

export interface Summary {
  overview: Overview;
  type_distribution: Record<string, number>;
  currency_distribution: Record<string, number>;
  assets: AssetSummary[];
}

export interface AssetDetail {
  asset: Asset;
  transactions: Transaction[];
  tags: Tag[];
  summary: {
    totalBuyQuantity: number;
    totalSellQuantity: number;
    holdingQuantity: number;
    totalBuyCost: number;
    totalSellRevenue: number;
    avgBuyCost: number;
  };
}
