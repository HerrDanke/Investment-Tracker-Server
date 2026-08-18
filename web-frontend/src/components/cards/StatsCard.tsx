import { fmt } from '../../lib/utils';
import type { Overview } from '../../types';

interface StatsCardProps {
  overview: Overview;
  lang?: string;
}

export function StatsCard({ overview, lang = 'zh' }: StatsCardProps) {
  const isPnlPos = overview.total_realized_pnl >= 0;
  const l = (zh: string, en: string) => lang === 'en' ? en : zh;
  const cards = [
    { label: l('总资产', 'Assets'), value: overview.total_assets + ' ' + l('项', ''), color: '' },
    { label: l('总投入', 'Invested'), value: fmt(overview.total_investment, lang), color: '' },
    { label: l('持仓成本', 'Cost Basis'), value: fmt(overview.cost_basis_of_holdings, lang), color: '' },
    { label: l('已实现盈亏', 'Realized P&L'), value: fmt(overview.total_realized_pnl, lang), color: isPnlPos ? 'text-green-600' : 'text-red-600' },
    { label: l('分红', 'Dividends'), value: fmt(overview.total_dividends, lang), color: 'text-green-600' },
    { label: l('手续费', 'Fees'), value: fmt(overview.total_fees, lang), color: 'text-zinc-500' },
    { label: l('税费', 'Tax'), value: fmt(overview.total_tax, lang), color: 'text-zinc-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="text-center">
          <div className="text-xs text-zinc-500 mb-1">{c.label}</div>
          <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
