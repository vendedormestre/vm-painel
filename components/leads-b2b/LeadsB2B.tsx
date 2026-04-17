import { getLeadsB2BData } from '@/lib/leads-b2b'
import { Period } from '@/lib/data'
import { TendenciaChart } from './TendenciaChart'
import { LeadsTable } from './LeadsTable'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <h3
        className="text-base mb-5"
        style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: '#0A0A0A' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

export async function LeadsB2B({ period }: { period: Period }) {
  let data
  try {
    data = await getLeadsB2BData(period)
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar leads B2B. Tente novamente.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: '#D4001F' }}
        >
          {data.total.toLocaleString('pt-BR')}
        </span>
        <span className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          leads no período
        </span>
      </div>

      <Card title="Tendência semanal">
        <TendenciaChart data={data.tendencia} />
      </Card>

      <Card title="Lista de leads">
        <LeadsTable leads={data.leads} />
      </Card>
    </div>
  )
}
