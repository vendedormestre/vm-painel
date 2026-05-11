'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ProcessoAtivo } from '@/lib/processo-view'

export function ProcessoSelector({
  processos,
  codigoPs,
}: {
  processos: ProcessoAtivo[]
  codigoPs?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('pv', value)
    } else {
      params.delete('pv')
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <select
      value={codigoPs ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C7C3',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: 14,
        fontFamily: 'var(--font-barlow)',
        color: codigoPs ? '#0D0B0A' : '#8A8986',
        outline: 'none',
        cursor: 'pointer',
        minWidth: 300,
        maxWidth: '100%',
      }}
    >
      <option value="">Selecione um processo</option>
      {processos.map(p => (
        <option key={p.codigo_ps} value={p.codigo_ps}>
          {p.codigo_ps} · {p.cargo} — {p.empresa}
        </option>
      ))}
    </select>
  )
}
