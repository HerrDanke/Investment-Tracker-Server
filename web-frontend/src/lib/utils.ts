// ==================== FORMATTING ====================

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export const fmt = (v: number): string => currencyFormatter.format(v);

export const fmtK = (v: number): string => {
  if (v >= 1000) return '€' + (v / 1000).toFixed(1) + 'k';
  return '€' + v.toFixed(0);
};

export const TYPE_LABELS: Record<string, string> = {
  stock: '股票',
  fund: '基金',
  etf: 'ETF',
  bond: '债券',
  crypto: '加密货币',
  other: '其他',
};

export const TXN_LABELS: Record<string, string> = {
  BUY: '买入',
  SELL: '卖出',
  DIVIDEND: '分红',
  INTEREST: '利息',
  SPLIT: '拆分',
  OTHER: '其他',
};

export const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export const CURRENCIES = ['CNY', 'USD', 'HKD', 'EUR', 'JPY', 'GBP'];
export const ASSET_TYPES = ['stock', 'fund', 'etf', 'bond', 'crypto', 'other'];
export const TXN_TYPES = ['BUY', 'SELL', 'DIVIDEND'];

// ==================== HELPERS ====================

export function classList(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function dateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}
