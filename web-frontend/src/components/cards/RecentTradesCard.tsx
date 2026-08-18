import { fmt, getTxnLabel } from '../../lib/utils';
import type { TransactionWithAsset } from '../../types';

interface RecentTradesCardProps {
  transactions: TransactionWithAsset[];
  lang?: string;
}

export function RecentTradesCard({ transactions, lang = 'zh' }: RecentTradesCardProps) {
  const recent = transactions.slice(0, 5);
  const l = (zh: string, en: string) => lang === 'en' ? en : zh;

  if (recent.length === 0) {
    return <div className="text-zinc-400 text-sm text-center py-4">{l('暂无交易记录', 'No transactions')}</div>;
  }

  return (
    <div className="space-y-2">
      {recent.map(t => (
        <div key={t.id} className="flex items-center justify-between text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{t.asset?.name ?? l('未知资产', 'Unknown')}</div>
            <div className="text-xs text-zinc-500">{t.date}</div>
          </div>
          <div className="text-right ml-2 shrink-0">
            <div className={`font-medium ${t.txn_type === 'BUY' ? 'text-red-600' : t.txn_type === 'SELL' ? 'text-green-600' : 'text-blue-600'}`}>
              {t.txn_type === 'BUY' ? '-' : t.txn_type === 'SELL' ? '+' : ''}{fmt(t.price * t.quantity, lang)}
            </div>
            <div className="text-xs text-zinc-500">{getTxnLabel(t.txn_type, lang)} {t.quantity}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
