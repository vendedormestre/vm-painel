import { Suspense } from 'react'
import { getCandidates, getCandidateFilters, Period } from '@/lib/data'
import { CandidatesFilters } from './CandidatesFilters'
import { PaginationControls } from './PaginationControls'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contactado: 'Contactado',
  video_enviado: 'Vídeo enviado',
  aprovado_triagem: 'Aprovado na triagem',
  reprovado: 'Reprovado',
  contratado: 'Contratado',
  descartado: 'Descartado',
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#8A8986',
  contactado: '#3B82F6',
  video_enviado: '#8B5CF6',
  aprovado_triagem: '#10B981',
  reprovado: '#EF4444',
  contratado: '#D4001F',
  descartado: '#6B7280',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtPhone(p: string | null) {
  return p?.replace(/\D/g, '') || ''
}

type Props = {
  period: Period
  page: number
  pageSize: number
  cargo?: string
  empresa?: string
  status?: string
}

export async function CandidatesTable({ period, page, pageSize, cargo, empresa, status }: Props) {
  let result
  let filterOptions

  try {
    ;[result, filterOptions] = await Promise.all([
      getCandidates(period, page, { cargo, empresa, status }, pageSize),
      getCandidateFilters(),
    ])
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar candidatos. Tente novamente.
      </p>
    )
  }

  const { candidates, total, pages, pageSize: ps = pageSize } = result

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)', color: '#0A0A0A' }}>
          {total.toLocaleString('pt-BR')} candidato{total !== 1 ? 's' : ''}
        </p>
        <Suspense fallback={null}>
          <CandidatesFilters cargos={filterOptions.cargos} empresas={filterOptions.empresas} />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #E8E7E4' }}>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
              {['Nome', 'Cargo', 'Empresa', 'Data', 'Canal', 'Status', ''].map(col => (
                <th
                  key={col}
                  className="text-left px-4 py-3 text-xs uppercase tracking-wider font-medium"
                  style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-sm"
                  style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}
                >
                  Nenhum candidato encontrado
                </td>
              </tr>
            ) : (
              candidates.map((c, i) => (
                <tr
                  key={`${c.email}-${i}`}
                  className="transition-colors hover:bg-gray-50"
                  style={{ borderBottom: '1px solid #F0EFED' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ fontFamily: 'var(--font-dm-sans)', color: '#0A0A0A' }}>
                    {c.fullname || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#4A4A4A', fontFamily: 'var(--font-dm-sans)' }}>
                    {c.cargo || '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#4A4A4A', fontFamily: 'var(--font-dm-sans)' }}>
                    {c.empresa || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                    {fmtDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                    {c.utm_source || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${STATUS_COLORS[c.status_atual] ?? '#8A8986'}18`,
                        color: STATUS_COLORS[c.status_atual] ?? '#8A8986',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {STATUS_LABELS[c.status_atual] ?? c.status_atual}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.whatsapp && fmtPhone(c.whatsapp) && (
                      <a
                        href={`https://wa.me/${fmtPhone(c.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no WhatsApp"
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(pages > 1 || total > 10) && (
        <Suspense fallback={null}>
          <PaginationControls page={page} pages={Math.max(1, pages)} total={total} pageSize={ps} />
        </Suspense>
      )}
    </div>
  )
}
