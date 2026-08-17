import { fmt, TYPE_LABELS } from '../../lib/utils';
import type { AssetSummary } from '../../types';

interface HoldingsCardProps {
  assets: AssetSummary[];
}

export function HoldingsCard({ assets }: HoldingsCardProps) {
  const held = assets.filter(a => a.holding > 0.0001);

  if (held.length === 0) {
    return <div className="text-zinc-400 text-sm text-center py-4">暂无持仓</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 pr-4">资产</th>
            <th className="pb-2 pr-4 text-right">持仓</th>
            <th className="pb-2 pr-4 text-right">成本</th>
            <th className="pb-2 text-right">均价</th>
          </tr>
        </thead>
        <tbody>
          {held.map(a => (
            <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <td className="py-2 pr-4 font-medium">{a.name}</td>
              <td className="py-2 pr-4 text-right">{a.holding.toFixed(2)}</td>
              <td className="py-2 pr-4 text-right">{fmt(a.holding_cost_basis)}</td>
              <td className="py-2 text-right">{fmt(a.avg_buy_cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
