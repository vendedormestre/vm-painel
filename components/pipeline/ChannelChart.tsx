'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

type Props = { data: { channel: string; count: number }[] }

export function ChannelChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-sm" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 0 }}>
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#8A8986' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="channel"
          width={88}
          tick={{ fontSize: 11, fill: '#0A0A0A' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, border: '1px solid #E8E7E4', borderRadius: 6 }}
          formatter={(v) => [v, 'Candidatos']}
        />
        <Bar dataKey="count" fill="#D4001F" radius={[0, 3, 3, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
