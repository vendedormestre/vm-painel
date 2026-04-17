import { getLeadsB2BData } from '@/lib/leads-b2b'
import { ProcessosPeriod } from '@/lib/processos'
import { TendenciaChart } from './TendenciaChart'
import { LeadsTable } from './LeadsTable'
import { Suspense } from 'react'
import { LeadsPeriodFilter } from './LeadsPeriodFilter'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <h3 className="text-base mb-5" style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: '#0A0A0A' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

export async function LeadsB2B({ lp }: { lp: ProcessosPeriod }) {
  let data
  try {
    data = await getLeadsB2BData(lp)
  } catch (e) {
    console.error('[LeadsB2B]', e)
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar leads B2B. Tente novamente.
      </p>
    )
  }

  // Diagnostic: table is empty
  if (data.totalGeral === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: '#FFFFFF', border: '1px dashed #C8C7C3' }}
      >
        <p className="text-sm mb-1" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
          A tabela <code>public.leads</code> está vazia
        </p>
        <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
          Acesse <code>/api/debug/leads</code> para inspecionar a estrutura da tabela
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={null}>
        <LeadsPeriodFilter current={lp} />
      </Suspense>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#D4001F' }}>
          {data.total.toLocaleString('pt-BR')}
        </span>
        <span className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          leads no período
        </span>
        {data.total === 0 && data.totalGeral > 0 && (
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontFamily: 'var(--font-dm-sans)' }}
          >
            {data.totalGeral.toLocaleString('pt-BR')} leads no banco — nenhum no período selecionado.
            Tente ampliar o filtro de período.
          </span>
        )}
      </div>

      {data.total > 0 && (
        <>
          <Card title="Tendência semanal">
            <TendenciaChart data={data.tendencia} />
          </Card>

          <Card title="Lista de leads">
            <LeadsTable leads={data.leads} />
          </Card>
        </>
      )}
    </div>
  )
}
