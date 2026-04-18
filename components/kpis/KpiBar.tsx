import { getKpiData, Period } from '@/lib/data'

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-2"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
      >
        {label}
      </p>
      <p
        className="text-4xl font-bold leading-none"
        style={{ color: '#D4001F', fontFamily: 'var(--font-syne)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export async function KpiBar({ period }: { period: Period }) {
  let data
  try {
    data = await getKpiData(period)
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar métricas. Tente novamente.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <KpiCard
        label="Total de candidatos"
        value={data.totalCandidatos.toLocaleString('pt-BR')}
      />
      <KpiCard
        label="Total de leads B2B"
        value={data.totalLeads.toLocaleString('pt-BR')}
      />
      <KpiCard
        label="Taxa de contato"
        value={`${data.taxaContato}%`}
      />
      <KpiCard
        label="Contratações confirmadas"
        value={data.contratados.toLocaleString('pt-BR')}
      />
      <KpiCard
        label="CPL realizado"
        value={data.cpl ?? '—'}
        sub={data.cpl ? 'spend ÷ leads (campanhas)' : 'Sem dados de campanhas'}
      />
      <KpiCard
        label="Custo por contratação"
        value={data.custoContratacao ?? '—'}
        sub={data.custoContratacao ? 'verba ÷ contratações' : 'Sem dados suficientes'}
      />
    </div>
  )
}
