'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Dot,
} from 'recharts'
import { SemanaData } from '@/lib/leads-b2b'

export function TendenciaChart({ data }: { data: SemanaData[] }) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-sm" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E7E4" vertical={false} />
        <XAxis
          dataKey="label"
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
          formatter={(v) => [v, 'Leads']}
          labelFormatter={(l) => `Semana de ${l}`}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#D4001F"
          strokeWidth={2}
          dot={<Dot r={4} fill="#D4001F" stroke="#FFFFFF" strokeWidth={2} />}
          activeDot={{ r: 5, fill: '#D4001F' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
