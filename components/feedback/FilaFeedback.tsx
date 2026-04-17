'use client'

import { useState, useEffect, useRef } from 'react'

type Candidato = {
  fullname: string | null
  email: string
  whatsapp: string | null
  cargo: string | null
  empresa: string | null
  created_at: string
  utm_source: string | null
  status_atual: string
  observacoes: string
  dias_aguardando: number
}

const STATUS_BTNS = [
  { value: 'contactado',      label: 'Contactado',    color: '#3B82F6' },
  { value: 'video_enviado',   label: 'Vídeo Enviado', color: '#8B5CF6' },
  { value: 'aprovado_triagem',label: 'Aprovado',      color: '#10B981' },
  { value: 'reprovado',       label: 'Reprovado',     color: '#EF4444' },
  { value: 'descartado',      label: 'Descartado',    color: '#6B7280' },
  { value: 'contratado',      label: 'Contratado',    color: '#D4001F' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtPhone(p: string | null) {
  return p?.replace(/\D/g, '') || ''
}

function CandidatoRow({
  candidato,
  onStatusChange,
}: {
  candidato: Candidato
  onStatusChange: (email: string, status: string) => void
}) {
  const [obs, setObs] = useState(candidato.observacoes)
  const savedObs = useRef(candidato.observacoes)

  async function saveObs() {
    if (obs === savedObs.current) return
    savedObs.current = obs
    await fetch('/api/feedback/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidato.email, status: candidato.status_atual, observacoes: obs }),
    })
  }

  const phone = fmtPhone(candidato.whatsapp)
  const diasColor =
    candidato.dias_aguardando > 7 ? { bg: '#FEE2E2', text: '#991B1B' }
    : candidato.dias_aguardando > 3 ? { bg: '#FEF3C7', text: '#92400E' }
    : { bg: '#F5F4F2', text: '#8A8986' }

  return (
    <tr style={{ borderBottom: '1px solid #F0EFED' }}>
      {/* Nome / Cargo */}
      <td className="px-3 py-3 align-top">
        <p className="text-sm font-medium" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
          {candidato.fullname || '—'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          {candidato.cargo || '—'}
        </p>
      </td>
      {/* Empresa */}
      <td className="px-3 py-3 align-top text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        {candidato.empresa || '—'}
      </td>
      {/* Data entrada */}
      <td className="px-3 py-3 align-top text-xs whitespace-nowrap" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        {fmtDate(candidato.created_at)}
      </td>
      {/* Dias aguardando */}
      <td className="px-3 py-3 align-top text-center">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded"
          style={{ backgroundColor: diasColor.bg, color: diasColor.text, fontFamily: 'var(--font-dm-sans)' }}
        >
          {candidato.dias_aguardando}d
        </span>
      </td>
      {/* Ações */}
      <td className="px-3 py-3 align-top" style={{ minWidth: 280 }}>
        <div className="flex flex-wrap gap-1">
          {STATUS_BTNS.map(btn => (
            <button
              key={btn.value}
              onClick={() => onStatusChange(candidato.email, btn.value)}
              className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${btn.color}1A`,
                color: btn.color,
                border: `1px solid ${btn.color}40`,
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          onBlur={saveObs}
          placeholder="Observação..."
          rows={1}
          className="mt-2 w-full text-xs rounded px-2 py-1 resize-none outline-none"
          style={{ border: '1px solid #E8E7E4', fontFamily: 'var(--font-dm-sans)', color: '#0A0A0A', backgroundColor: '#FFFFFF' }}
        />
      </td>
      {/* WhatsApp */}
      <td className="px-3 py-3 align-top text-center">
        {phone && (
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 inline-flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        )}
      </td>
    </tr>
  )
}

export function FilaFeedback() {
  const [queue, setQueue] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/feedback/candidatos')
      .then(r => r.json())
      .then(d => { setQueue(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  function handleStatusChange(email: string, status: string) {
    setQueue(q => q.filter(c => c.email !== email))
    fetch('/api/feedback/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, status }),
    })
  }

  if (loading) {
    return <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }} />
  }

  if (error) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        Erro ao carregar fila: {error}
      </p>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E8E7E4' }}>
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}>
          Fila de feedback
        </h3>
        {queue.length > 0 ? (
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontFamily: 'var(--font-dm-sans)' }}
          >
            {queue.length} aguardando
          </span>
        ) : (
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontFamily: 'var(--font-dm-sans)' }}
          >
            Em dia ✓
          </span>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            Nenhum candidato aguardando feedback
          </p>
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 480 }}>
          <table className="w-full text-xs" style={{ minWidth: 740 }}>
            <thead>
              <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
                {['Nome / Cargo', 'Empresa', 'Entrada', 'Aguardando', 'Ação rápida', 'WA'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium uppercase tracking-wider" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map(c => (
                <CandidatoRow key={c.email} candidato={c} onStatusChange={handleStatusChange} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
