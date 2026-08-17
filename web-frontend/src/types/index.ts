export interface Asset {
  id: number
  name: string
  symbol?: string
  asset_type: string
  currency: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  asset_id: number
  txn_type: string
  date: string
  price: number
  quantity: number
  fee: number
  tax: number
  currency: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  category: string
  color: string
}

export interface AssetWithTags extends Asset {
  tags: Tag[]
}

export interface TransactionWithAsset extends Transaction {
  asset?: Asset
}

export interface AssetSummary {
  id: number
  name: string
  symbol?: string
  asset_type: string
  currency: string
  holding: number
  buy_cost: number
  sell_revenue: number
  avg_buy_cost: number
  holding_cost_basis: number
  realized_pnl?: number
  tags: Tag[]
}

export interface Overview {
  total_assets: number
  total_investment: number
  total_realized_pnl: number
  total_dividends: number
  total_fees: number
  total_tax: number
  cost_basis_of_holdings: number
}

export interface Summary {
  overview: Overview
  type_distribution: Record<string, number>
  currency_distribution: Record<string, number>
  assets: AssetSummary[]
}

export interface CreateAsset {
  name: string
  symbol?: string
  asset_type?: string
  currency?: string
  tag_ids?: number[]
}

export interface CreateTransaction {
  asset_id: number
  txn_type: string
  date: string
  price: number
  quantity: number
  fee?: number
  tax?: number
  currency?: string
  notes?: string
}

export interface CreateTag {
  name: string
  category?: string
  color?: string
}

// ==================== DASHBOARD LAYOUT ====================

export type CardType = 'stats' | 'chart-holdings' | 'chart-type' | 'chart-currency' | 'recent-trades' | 'holdings' | 'chart-tags';
export type ChartType = 'bar' | 'pie' | 'line';

export interface LayoutCard {
  id: string;
  type: CardType;
  chartType?: ChartType;
  collapsed?: boolean;
  size: { w: number; h: number };
}

export interface DashboardLayout {
  cards: LayoutCard[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  cards: [
    { id: 'stats-1', type: 'stats', size: { w: 4, h: 1 } },
    { id: 'chart-holdings-1', type: 'chart-holdings', chartType: 'bar', size: { w: 2, h: 2 } },
    { id: 'chart-type-1', type: 'chart-type', chartType: 'pie', size: { w: 2, h: 2 } },
    { id: 'chart-currency-1', type: 'chart-currency', chartType: 'pie', size: { w: 2, h: 2 } },
    { id: 'recent-trades-1', type: 'recent-trades', size: { w: 2, h: 2 } },
    { id: 'holdings-1', type: 'holdings', size: { w: 4, h: 2 } },
  ]
};

export const CARD_TITLES: Record<CardType, string> = {
  'stats': '投资概览',
  'chart-holdings': '资产持仓分布',
  'chart-type': '资产类型分布',
  'chart-currency': '货币分布',
  'recent-trades': '最近交易',
  'holdings': '持仓明细',
  'chart-tags': '标签分布',
};

export const AVAILABLE_CARDS: { type: CardType; label: string; description: string }[] = [
  { type: 'stats', label: '投资概览', description: '总投入、持仓成本、盈亏等核心数据' },
  { type: 'chart-holdings', label: '资产持仓分布', description: '各资产持仓成本图表' },
  { type: 'chart-type', label: '资产类型分布', description: '按资产类型分类统计' },
  { type: 'chart-currency', label: '货币分布', description: '按货币分类统计' },
  { type: 'chart-tags', label: '标签分布', description: '按标签分类统计' },
  { type: 'recent-trades', label: '最近交易', description: '最近 5 笔交易记录' },
  { type: 'holdings', label: '持仓明细', description: '所有持仓资产及盈亏' },
];
