import { fmt } from '../../lib/utils';
import type { Overview } from '../../types';

interface StatsCardProps {
  overview: Overview;
}

export function StatsCard({ overview }: StatsCardProps) {
  const isPnlPos = overview.total_realized_pnl >= 0;
  const cards = [
    { label: '总资产', value: overview.total_assets + ' 项', color: '' },
    { label: '总投入', value: fmt(overview.total_investment), color: '' },
    { label: '持仓成本', value: fmt(overview.cost_basis_of_holdings), color: '' },
    { label: '已实现盈亏', value: fmt(overview.total_realized_pnl), color: isPnlPos ? 'text-green-600' : 'text-red-600' },
    { label: '分红', value: fmt(overview.total_dividends), color: 'text-green-600' },
    { label: '手续费', value: fmt(overview.total_fees), color: 'text-zinc-500' },
    { label: '税费', value: fmt(overview.total_tax), color: 'text-zinc-500' },
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
