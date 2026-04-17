'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Props = { data: { date: string; count: number }[] }

function fmt(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

export function VolumeChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E4" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#8A8986' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#8A8986' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, border: '1px solid #E8E7E4', borderRadius: 6 }}
          formatter={(v) => [v, 'Candidatos']}
          labelFormatter={(label: unknown) => fmt(String(label))}
        />
        <Bar dataKey="count" fill="#D4001F" radius={[3, 3, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
