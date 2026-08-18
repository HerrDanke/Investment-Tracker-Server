// ==================== FORMATTING ====================

export function fmt(v: number, lang: string = 'zh'): string {
  return new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(v);
}

export function fmtK(v: number): string {
  if (v >= 1000) return '€' + (v / 1000).toFixed(1) + 'k';
  return '€' + v.toFixed(0);
}

export function getTypeLabel(type: string, lang: string = 'zh'): string {
  const labels: Record<string, Record<string, string>> = {
    zh: { stock: '股票', fund: '基金', etf: 'ETF', bond: '债券', crypto: '加密货币', other: '其他' },
    en: { stock: 'Stock', fund: 'Fund', etf: 'ETF', bond: 'Bond', crypto: 'Crypto', other: 'Other' },
  };
  return labels[lang]?.[type] || type;
}

export function getTxnLabel(type: string, lang: string = 'zh'): string {
  const labels: Record<string, Record<string, string>> = {
    zh: { BUY: '买入', SELL: '卖出', DIVIDEND: '分红', INTEREST: '利息', SPLIT: '拆分', OTHER: '其他' },
    en: { BUY: 'Buy', SELL: 'Sell', DIVIDEND: 'Dividend', INTEREST: 'Interest', SPLIT: 'Split', OTHER: 'Other' },
  };
  return labels[lang]?.[type] || type;
}

// Legacy exports (defaults to Chinese for backward compatibility)
export const TYPE_LABELS: Record<string, string> = {
  stock: '股票', fund: '基金', etf: 'ETF', bond: '债券', crypto: '加密货币', other: '其他',
};

export const TXN_LABELS: Record<string, string> = {
  BUY: '买入', SELL: '卖出', DIVIDEND: '分红', INTEREST: '利息', SPLIT: '拆分', OTHER: '其他',
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
