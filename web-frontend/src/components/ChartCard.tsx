import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export default function ChartCard({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}
