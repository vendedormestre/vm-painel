'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const btn: React.CSSProperties = {
  border: '1px solid #C8C7C3',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: 13,
  fontFamily: 'var(--font-dm-sans)',
  backgroundColor: '#FFFFFF',
  color: '#0A0A0A',
  cursor: 'pointer',
}

export function PaginationControls({ page, pages }: { page: number; pages: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Página {page} de {pages}
      </p>
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
