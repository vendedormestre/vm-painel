'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const PAGE_SIZES = [10, 20, 50, 100]

const btn: React.CSSProperties = {
  border: '1px solid #C8C7C3',
  borderRadius: 6,
  padding: '4px 12px',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans)',
  backgroundColor: '#FFFFFF',
  color: '#0A0A0A',
  cursor: 'pointer',
}

const sel: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #C8C7C3',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 12,
  fontFamily: 'var(--font-dm-sans)',
  color: '#0A0A0A',
  cursor: 'pointer',
  outline: 'none',
}

type Props = { page: number; pages: number; total: number; pageSize: number }

export function PaginationControls({ page, pages, total, pageSize }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goTo(p: number, ps?: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    if (ps !== undefined) params.set('ps', String(ps))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div
      className="px-4 py-3 border-t flex items-center justify-between flex-wrap gap-2"
      style={{ borderColor: '#E8E7E4', backgroundColor: '#FAFAF9', borderRadius: '0 0 8px 8px' }}
    >
      <div className="flex items-center gap-3">
        <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          Página {page} de {pages} · {total.toLocaleString('pt-BR')} total
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>por página:</span>
          <select
            value={pageSize}
            onChange={e => goTo(1, Number(e.target.value))}
            style={sel}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => goTo(page - 1)} disabled={page <= 1} style={btn} className="disabled:opacity-40">
          ← Anterior
        </button>
        <button onClick={() => goTo(page + 1)} disabled={page >= pages} style={btn} className="disabled:opacity-40">
          Próximo →
        </button>
      </div>
    </div>
  )
}
