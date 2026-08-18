import { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { fmt, fmtK, PIE_COLORS } from '../../lib/utils';
import type { ChartType } from '../../types';

interface ChartDataItem {
  name: string;
  value: number;
}

interface ChartCardProps {
  title: string;
  data: ChartDataItem[];
  initialChartType?: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  lang?: string;
}

export function ChartCard({ title, data, initialChartType = 'bar', onChartTypeChange, lang = 'zh' }: ChartCardProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);

  const handleTypeChange = () => {
    const next: Record<ChartType, ChartType> = { bar: 'pie', pie: 'line', line: 'bar' };
    const newType = next[chartType];
    setChartType(newType);
    onChartTypeChange?.(newType);
  };

  const chartIcons: Record<ChartType, React.ReactNode> = {
    bar: <BarChart3 size={14} />,
    pie: <PieIcon size={14} />,
    line: <TrendingUp size={14} />,
  };

  const renderChart = () => {
    if (data.length === 0) {
      return <div className="flex items-center justify-center h-full text-zinc-400 text-sm">{lang === 'en' ? 'No data' : '暂无数据'}</div>;
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} fontSize={10} />
              <YAxis tickFormatter={fmtK} fontSize={10} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        // 自定义标签：显示名称 + 百分比，带引导线
        const renderLabel = ({ cx, cy, midAngle, outerRadius, name, percent, index }: any) => {
          if (percent < 0.03) return null; // 小于3%不显示标签，避免重叠
          const RADIAN = Math.PI / 180;
          const radius = outerRadius + 30;
          const x = cx + radius * Math.cos(-midAngle * RADIAN);
          const y = cy + radius * Math.sin(-midAngle * RADIAN);
          const anchor = x > cx ? 'start' : 'end';
          return (
            <text x={x} y={y} textAnchor={anchor} fontSize={10} fill="currentColor" className="text-zinc-600 dark:text-zinc-400">
              {name.length > 6 ? name.slice(0, 6) + '…' : name} ({(percent * 100).toFixed(0)}%)
            </text>
          );
        };

        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={renderLabel} labelLine={{ stroke: '#a1a1aa', strokeWidth: 1 }}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={70} fontSize={10} />
              <YAxis tickFormatter={fmtK} fontSize={10} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{title}</span>
        <button
          onClick={handleTypeChange}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-600"
          title="切换图表类型"
        >
          {chartIcons[chartType]}
        </button>
      </div>
      <div className="flex-1 min-h-0">{renderChart()}</div>
    </div>
  );
}
