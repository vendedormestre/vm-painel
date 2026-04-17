'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProcessoData } from '@/lib/processos'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', video_enviado: 'Vídeo enviado',
  aprovado_triagem: 'Aprovado', reprovado: 'Reprovado',
  contratado: 'Contratado', descartado: 'Descartado',
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#8A8986', contactado: '#3B82F6', video_enviado: '#8B5CF6',
  aprovado_triagem: '#10B981', reprovado: '#EF4444',
  contratado: '#D4001F', descartado: '#6B7280',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtPhone(p: string | null) {
  return p?.replace(/\D/g, '') || ''
}

function Counter({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="text-center">
      <p
        className="text-2xl font-bold leading-none"
        style={{ fontFamily: 'var(--font-syne)', color: alert && value > 0 ? '#F59E0B' : '#0A0A0A' }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
    </div>
  )
}

export function ProcessoCard({ processo }: { processo: ProcessoData }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [obs, setObs] = useState(processo.observacoes ?? '')
  const [saving, setSaving] = useState(false)
  const [encerring, setEncerring] = useState(false)

  const saude = processo.saude
  const borderColor = saude.tipo === 'saudavel' ? '#10B981' : saude.tipo === 'atencao' ? '#F59E0B' : '#D4001F'
  const badgeBg = saude.tipo === 'saudavel' ? '#D1FAE5' : saude.tipo === 'atencao' ? '#FEF3C7' : '#FEE2E2'
  const badgeColor = saude.tipo === 'saudavel' ? '#065F46' : saude.tipo === 'atencao' ? '#92400E' : '#991B1B'
  const badgeLabel =
    saude.tipo === 'saudavel' ? 'Saudável' :
    saude.tipo === 'atencao' ? 'Atenção' :
    `Gargalo: ${saude.etapa}`

  const max = processo.funil[0].count || 1

  async function saveObs() {
    setSaving(true)
    await fetch(`/api/processos/${processo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes: obs }),
    })
    setSaving(false)
    router.refresh()
  }

  async function encerrar() {
    if (!confirm(`Encerrar o processo "${processo.cargo}" em ${processo.empresa}?`)) return
    setEncerring(true)
    await fetch(`/api/processos/${processo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'encerrado', data_encerramento: new Date().toISOString() }),
    })
    setEncerring(false)
    router.refresh()
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', borderLeft: `4px solid ${borderColor}` }}
    >
      {/* Clickable header */}
      <div className="p-5 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-base leading-tight truncate"
              style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}
            >
              {processo.cargo}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
              {processo.empresa}{processo.canalPrincipal ? ` · ${processo.canalPrincipal}` : ''}
            </p>
          </div>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: badgeBg, color: badgeColor, fontFamily: 'var(--font-dm-sans)' }}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 py-3 rounded-lg" style={{ backgroundColor: '#F5F4F2' }}>
          <Counter label="Candidatos" value={processo.totalCandidatos} />
          <Counter label="Parados" value={processo.parados} alert />
          <Counter label="Contratados" value={processo.contratados} />
        </div>

        {/* Mini funil */}
        <div className="flex flex-col gap-2">
          {processo.funil.map(etapa => (
            <div key={etapa.label} className="flex items-center gap-2">
              <span className="text-xs shrink-0" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)', width: '5.5rem', textAlign: 'right' }}>
                {etapa.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E7E4' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${max > 0 ? Math.round((etapa.count / max) * 100) : 0}%`, backgroundColor: '#0A0A0A' }}
                />
              </div>
              <span className="text-xs w-5 text-right" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
                {etapa.count}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
            {processo.ultimoCandidato ? `Último: ${fmtDate(processo.ultimoCandidato)}` : 'Sem candidatos'}
          </p>
          <span className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            {expanded ? '▲ Fechar' : '▼ Detalhes'}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-5 pb-5 pt-4 flex flex-col gap-5" style={{ borderColor: '#E8E7E4', backgroundColor: '#FAFAF9' }}>
          {/* Candidate list */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
              Candidatos ({processo.candidatos.length})
            </h4>
            <div className="overflow-auto rounded-lg max-h-60" style={{ border: '1px solid #E8E7E4' }}>
              <table className="w-full text-xs min-w-[480px]">
                <thead>
                  <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
                    {['Nome', 'Entrada', 'Status', 'Dias s/ atualiz.', ''].map(c => (
                      <th key={c} className="text-left px-3 py-2 font-medium uppercase tracking-wider" style={{ color: '#8A8986' }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processo.candidatos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6" style={{ color: '#C8C7C3' }}>Nenhum candidato</td>
                    </tr>
                  ) : processo.candidatos.map((c, i) => (
                    <tr
                      key={`${c.email}-${i}`}
                      style={{
                        borderBottom: '1px solid #F0EFED',
                        backgroundColor: c.parado ? '#FFFBEB' : undefined,
                      }}
                    >
                      <td className="px-3 py-2 font-medium" style={{ color: '#0A0A0A' }}>{c.fullname || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: '#8A8986' }}>{fmtDate(c.created_at)}</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[c.status_atual] ?? '#8A8986'}18`,
                            color: STATUS_COLORS[c.status_atual] ?? '#8A8986',
                          }}
                        >
                          {STATUS_LABELS[c.status_atual] ?? c.status_atual}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center" style={{ color: c.parado ? '#F59E0B' : '#8A8986' }}>
                        {c.dias_sem_atualizacao}d{c.parado ? ' ⚠' : ''}
                      </td>
                      <td className="px-3 py-2">
                        {c.whatsapp && fmtPhone(c.whatsapp) && (
                          <a
                            href={`https://wa.me/${fmtPhone(c.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                            onClick={e => e.stopPropagation()}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
            >
              Observações gerais
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Adicione observações sobre este processo..."
              className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none"
              style={{ border: '1px solid #C8C7C3', fontFamily: 'var(--font-dm-sans)', color: '#0A0A0A', backgroundColor: '#FFFFFF' }}
            />
            <button
              onClick={saveObs}
              disabled={saving}
              className="mt-2 px-4 py-1.5 rounded-md text-sm disabled:opacity-50"
              style={{ backgroundColor: '#0A0A0A', color: '#F5F4F2', fontFamily: 'var(--font-dm-sans)' }}
            >
              {saving ? 'Salvando...' : 'Salvar observações'}
            </button>
          </div>

          {/* Encerrar */}
          <div className="flex justify-end pt-2 border-t" style={{ borderColor: '#E8E7E4' }}>
            <button
              onClick={encerrar}
              disabled={encerring}
              className="px-4 py-2 rounded-md text-sm disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontFamily: 'var(--font-dm-sans)' }}
            >
              {encerring ? 'Encerrando...' : 'Encerrar processo'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
