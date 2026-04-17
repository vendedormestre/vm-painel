import { getProcessosAtivos } from '@/lib/processos'
import { ProcessoCard } from './ProcessoCard'
import { NovoProcessoModal } from './NovoProcessoModal'

export async function ProcessosGrid() {
  let processos
  try {
    processos = await getProcessosAtivos()
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar processos. Tente novamente.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mt-0.5" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            {processos.length} processo{processos.length !== 1 ? 's' : ''} ativo{processos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NovoProcessoModal />
      </div>

      {processos.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#FFFFFF', border: '1px dashed #C8C7C3' }}
        >
          <p className="text-sm mb-1" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
            Nenhum processo ativo
          </p>
          <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
            Clique em &ldquo;+ Novo processo&rdquo; para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processos.map(p => (
            <ProcessoCard key={p.id} processo={p} />
          ))}
        </div>
      )}
    </div>
  )
}
