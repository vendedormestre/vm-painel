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
  { value: 'contactado',       label: 'Contactado',    color: '#3B82F6' },
  { value: 'video_enviado',    label: 'Vídeo Enviado', color: '#8B5CF6' },
  { value: 'aprovado_triagem', label: 'Aprovado',      color: '#10B981' },
  { value: 'reprovado',        label: 'Reprovado',     color: '#EF4444' },
  { value: 'descartado',       label: 'Descartado',    color: '#6B7280' },
  { value: 'contratado',       label: 'Contratado',    color: '#D4001F' },
]

const PAGE_SIZES = [10, 25, 50, 100]

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

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtPhone(p: string | null) {
  return p?.replace(/\D/g, '') || ''
}

function CandidatoRow({
  candidato,
  selected,
  onToggle,
  onStatusChange,
}: {
  candidato: Candidato
  selected: boolean
  onToggle: (email: string) => void
  onStatusChange: (email: string, status: string) => void
}) {
  const [obs, setObs] = useState(candidato.observacoes)
  const savedObs = useRef(candidato.observacoes)

  async function saveObs() {
    if (obs === savedObs.current) return
    savedObs.current = obs
    fetch('/api/feedback/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidato.email, status: candidato.status_atual, observacoes: obs }),
    })
  }

  const phone = fmtPhone(candidato.whatsapp)
  const diasColor =
    candidato.dias_aguardando > 7  ? { bg: '#FEE2E2', text: '#991B1B' }
    : candidato.dias_aguardando > 3 ? { bg: '#FEF3C7', text: '#92400E' }
    : { bg: '#F5F4F2', text: '#8A8986' }

  return (
    <tr style={{ borderBottom: '1px solid #F0EFED', backgroundColor: selected ? '#F5F4F2' : undefined }}>
      {/* Checkbox */}
      <td className="px-3 py-3 align-top text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(candidato.email)}
          style={{ cursor: 'pointer', width: 14, height: 14 }}
        />
      </td>
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
      <td className="px-3 py-3 align-top" style={{ minWidth: 200 }}>
        {/* Mobile: dropdown */}
        <div className="sm:hidden mb-1">
          <select
            defaultValue=""
            onChange={e => { if (e.target.value) { onStatusChange(candidato.email, e.target.value); (e.target as HTMLSelectElement).value = '' } }}
            style={{ ...sel, width: '100%' }}
          >
            <option value="" disabled>Atualizar status...</option>
            {STATUS_BTNS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        {/* Desktop: buttons */}
        <div className="hidden sm:flex flex-wrap gap-1">
          {STATUS_BTNS.map(b => (
            <button
              key={b.value}
              onClick={() => onStatusChange(candidato.email, b.value)}
              className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `${b.color}1A`,
                color: b.color,
                border: `1px solid ${b.color}40`,
                fontFamily: 'var(--font-dm-sans)',
                transition: 'opacity 200ms',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        {/* Observação — explicitly interactive */}
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          onBlur={saveObs}
          placeholder="Observação (salva ao sair do campo)..."
          rows={2}
          style={{
            marginTop: 6,
            width: '100%',
            fontSize: 12,
            fontFamily: 'var(--font-dm-sans)',
            color: '#0A0A0A',
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C7C3',
            borderRadius: 6,
            padding: '6px 8px',
            resize: 'vertical',
            outline: 'none',
            cursor: 'text',
            display: 'block',
          }}
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
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('contactado')
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetch('/api/feedback/candidatos')
      .then(r => r.json())
      .then(d => { setQueue(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  // Reset to page 1 when page size changes
  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setCurrentPage(1)
    setSelected(new Set())
  }

  const totalPages = Math.max(1, Math.ceil(queue.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = queue.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Selection helpers
  const pageEmails = paginated.map(c => c.email)
  const allOnPageSelected = pageEmails.length > 0 && pageEmails.every(e => selected.has(e))
  const someOnPageSelected = pageEmails.some(e => selected.has(e))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allOnPageSelected) pageEmails.forEach(e => next.delete(e))
      else pageEmails.forEach(e => next.add(e))
      return next
    })
  }

  function toggleOne(email: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(email) ? next.delete(email) : next.add(email)
      return next
    })
  }

  function handleStatusChange(email: string, status: string) {
    setQueue(q => q.filter(c => c.email !== email))
    setSelected(prev => { const n = new Set(prev); n.delete(email); return n })
    fetch('/api/feedback/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, status }),
    })
  }

  async function applyBulk() {
    if (selected.size === 0) return
    setBulkLoading(true)
    const emails = [...selected]
    setQueue(q => q.filter(c => !selected.has(c.email)))
    setSelected(new Set())
    await fetch('/api/feedback/candidatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails, status: bulkStatus }),
    })
    setBulkLoading(false)
  }

  if (loading) {
    return <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }} />
  }
  if (error) {
    return <p className="text-sm py-4 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>Erro: {error}</p>
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: '#E8E7E4' }}>
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}>
          Fila de feedback
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {queue.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontFamily: 'var(--font-dm-sans)' }}>
              {queue.length} aguardando
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>por página:</span>
            <select value={pageSize} onChange={e => handlePageSizeChange(Number(e.target.value))} style={sel}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          className="px-5 py-3 flex items-center gap-3 flex-wrap border-b"
          style={{ backgroundColor: '#F5F4F2', borderColor: '#E8E7E4' }}
        >
          <span className="text-xs font-semibold" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={sel}>
            {STATUS_BTNS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <button
            onClick={applyBulk}
            disabled={bulkLoading}
            className="text-xs px-3 py-1.5 rounded disabled:opacity-60"
            style={{ backgroundColor: '#0A0A0A', color: '#F5F4F2', fontFamily: 'var(--font-dm-sans)', cursor: 'pointer' }}
          >
            {bulkLoading ? 'Aplicando...' : 'Aplicar a todos'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs px-3 py-1.5 rounded"
            style={{ ...btn, color: '#8A8986' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {queue.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            Nenhum candidato aguardando feedback ✓
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 780 }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
                  <th className="px-3 py-2 text-center" style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected }}
                      onChange={toggleAll}
                      style={{ cursor: 'pointer', width: 14, height: 14 }}
                      title="Selecionar todos da página"
                    />
                  </th>
                  {['Nome / Cargo', 'Empresa', 'Entrada', 'Aguardando', 'Ação rápida / Observação', 'WA'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium uppercase tracking-wider" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(c => (
                  <CandidatoRow
                    key={c.email}
                    candidato={c}
                    selected={selected.has(c.email)}
                    onToggle={toggleOne}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div
            className="px-5 py-3 border-t flex items-center justify-between flex-wrap gap-2"
            style={{ borderColor: '#E8E7E4', backgroundColor: '#FAFAF9' }}
          >
            <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
              Página {safePage} de {totalPages} · {queue.length} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={btn}
                className="disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={btn}
                className="disabled:opacity-40"
              >
                Próximo →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
