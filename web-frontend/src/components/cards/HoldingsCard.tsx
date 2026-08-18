import { fmt, getTypeLabel } from '../../lib/utils';
import type { AssetSummary } from '../../types';

interface HoldingsCardProps {
  assets: AssetSummary[];
  lang?: string;
}

export function HoldingsCard({ assets, lang = 'zh' }: HoldingsCardProps) {
  const held = assets.filter(a => a.holding > 0.0001);
  const l = (zh: string, en: string) => lang === 'en' ? en : zh;

  if (held.length === 0) {
    return <div className="text-zinc-400 text-sm text-center py-4">{l('暂无持仓', 'No holdings')}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
            <th className="pb-2 pr-4">{l('资产', 'Asset')}</th>
            <th className="pb-2 pr-4 text-right">{l('持仓', 'Holding')}</th>
            <th className="pb-2 pr-4 text-right">{l('成本', 'Cost')}</th>
            <th className="pb-2 text-right">{l('均价', 'Avg Price')}</th>
          </tr>
        </thead>
        <tbody>
          {held.map(a => (
            <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <td className="py-2 pr-4 font-medium">{a.name}</td>
              <td className="py-2 pr-4 text-right">{a.holding.toFixed(2)}</td>
              <td className="py-2 pr-4 text-right">{fmt(a.holding_cost_basis, lang)}</td>
              <td className="py-2 text-right">{fmt(a.avg_buy_cost, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
