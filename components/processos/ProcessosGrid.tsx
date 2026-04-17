import { Suspense } from 'react'
import { getProcessosAtivos, ProcessosPeriod } from '@/lib/processos'
import { ProcessoCard } from './ProcessoCard'
import { NovoProcessoModal } from './NovoProcessoModal'
import { ProcessosPeriodFilter } from './ProcessosPeriodFilter'

export async function ProcessosGrid({ pp }: { pp: ProcessosPeriod }) {
  let processos
  try {
    processos = await getProcessosAtivos(pp)
  } catch (e) {
    console.error('[ProcessosGrid]', e)
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar processos. Tente novamente.
      </p>
    )
  }

  // Group by empresa, preserving the sort order (first occurrence of each empresa determines its position)
  const empresaOrder: string[] = []
  const byEmpresa: Record<string, typeof processos> = {}
  processos.forEach(p => {
    if (!byEmpresa[p.empresa]) {
      byEmpresa[p.empresa] = []
      empresaOrder.push(p.empresa)
    }
    byEmpresa[p.empresa].push(p)
  })

  const multiEmpresa = empresaOrder.length > 1

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          {processos.length} grupo{processos.length !== 1 ? 's' : ''} ·{' '}
          {empresaOrder.length} empresa{empresaOrder.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Suspense fallback={null}>
            <ProcessosPeriodFilter current={pp} />
          </Suspense>
          <NovoProcessoModal />
        </div>
      </div>

      {processos.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#FFFFFF', border: '1px dashed #C8C7C3' }}
        >
          <p className="text-sm mb-1" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
            Nenhum candidato no período selecionado
          </p>
          <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
            Tente &ldquo;Todo o período&rdquo; ou verifique os dados em <code>public.aplicacao</code>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {empresaOrder.map(empresa => (
            <div key={empresa} className="flex flex-col gap-3">
              {/* Empresa separator — only when there's more than one */}
              {multiEmpresa && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ backgroundColor: '#E8E7E4' }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-2"
                    style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {empresa}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: '#E8E7E4' }} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {byEmpresa[empresa].map(p => (
                  <ProcessoCard key={`${p.empresa}|${p.cargo}`} processo={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
