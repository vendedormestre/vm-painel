'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'novo', label: 'Novo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'video_enviado', label: 'Vídeo enviado' },
  { value: 'aprovado_triagem', label: 'Aprovado na triagem' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'contratado', label: 'Contratado' },
  { value: 'descartado', label: 'Descartado' },
]

const sel: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #C8C7C3',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'var(--font-dm-sans)',
  color: '#0A0A0A',
  outline: 'none',
  cursor: 'pointer',
}

export function CandidatesFilters({ cargos, empresas }: { cargos: string[]; empresas: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <select value={searchParams.get('cargo') || ''} onChange={e => update('cargo', e.target.value)} style={sel}>
        <option value="">Todos os cargos</option>
        {cargos.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={searchParams.get('empresa') || ''} onChange={e => update('empresa', e.target.value)} style={sel}>
        <option value="">Todas as empresas</option>
        {empresas.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      <select value={searchParams.get('status') || ''} onChange={e => update('status', e.target.value)} style={sel}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
