import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string
  icon?: ReactNode
  valueColor?: string
}

export default function StatCard({ title, value, icon, valueColor }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${valueColor || ''}`}>{value}</div>
    </div>
  )
}
