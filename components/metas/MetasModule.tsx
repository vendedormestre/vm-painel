'use client'

import { useState, useEffect, FormEvent } from 'react'

type MetasData = {
  id?: string
  periodo: string
  meta_candidatos:   number | null
  meta_contratacoes: number | null
  meta_leads:        number | null
  verba_investida:   number | null
  meta_cpl:          number | null
}

type Realizado = {
  candidatos:   number
  contratacoes: number
  leads:        number
  cpl:          number | null
}

type ApiResponse = {
  periodo:   string
  metas:     MetasData | null
  realizado: Realizado
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #C8C7C3',
  fontSize: 14,
  fontFamily: 'var(--font-dm-sans)',
  color: '#0A0A0A',
  backgroundColor: '#FFFFFF',
  outline: 'none',
}

function currentPeriodo() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function getPeriodOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i <= 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

function ProgressBar({
  label,
  realizado,
  meta,
  invertido = false,
  prefix = '',
  suffix = '',
}: {
  label:     string
  realizado: number | null
  meta:      number | null
  invertido?: boolean
  prefix?:   string
  suffix?:   string
}) {
  if (meta == null) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
        <span className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>Meta não cadastrada</span>
      </div>
    )
  }

  const r = realizado ?? 0
  let barPct: number
  let color: string

  if (invertido) {
    // Lower realizado = better. Bar fills as CPL approaches 0 relative to meta.
    barPct  = meta > 0 ? Math.min(Math.round((meta / Math.max(r, 0.01)) * 100), 100) : 0
    color   = r <= meta ? '#22c55e' : r <= meta * 1.5 ? '#f59e0b' : '#D4001F'
  } else {
    barPct = meta > 0 ? Math.min(Math.round((r / meta) * 100), 100) : 0
    color  = barPct >= 80 ? '#22c55e' : barPct >= 50 ? '#f59e0b' : '#D4001F'
  }

  const pctLabel = invertido
    ? (r <= meta ? `${Math.round((1 - r / meta) * 100)}% abaixo da meta ✓` : `${Math.round((r / meta - 1) * 100)}% acima da meta`)
    : `${barPct}%`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
          {label}
        </span>
        <span className="text-xs text-right" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)', whiteSpace: 'nowrap' }}>
          {prefix}{r}{suffix} / {prefix}{meta}{suffix} ({pctLabel})
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E7E4' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

const FIELDS = [
  { key: 'meta_candidatos',   label: 'Meta de candidatos',   type: 'number', step: '1' },
  { key: 'meta_contratacoes', label: 'Meta de contratações', type: 'number', step: '1' },
  { key: 'meta_leads',        label: 'Meta de leads B2B',    type: 'number', step: '1' },
  { key: 'verba_investida',   label: 'Verba investida (R$)', type: 'number', step: '0.01' },
  { key: 'meta_cpl',          label: 'Meta de CPL (R$)',     type: 'number', step: '0.01' },
] as const

export function MetasModule() {
  const PERIODS = getPeriodOptions()
  const [periodo, setPeriodo] = useState(currentPeriodo)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [form, setForm] = useState<Record<string, string>>({
    meta_candidatos: '', meta_contratacoes: '', meta_leads: '', verba_investida: '', meta_cpl: '',
  })

  useEffect(() => {
    setLoading(true)
    fetch(`/api/metas?periodo=${periodo}`)
      .then(r => r.json())
      .then((d: ApiResponse) => {
        setData(d)
        setForm({
          meta_candidatos:   d.metas?.meta_candidatos   != null ? String(d.metas.meta_candidatos)   : '',
          meta_contratacoes: d.metas?.meta_contratacoes != null ? String(d.metas.meta_contratacoes) : '',
          meta_leads:        d.metas?.meta_leads        != null ? String(d.metas.meta_leads)        : '',
          verba_investida:   d.metas?.verba_investida   != null ? String(d.metas.verba_investida)   : '',
          meta_cpl:          d.metas?.meta_cpl          != null ? String(d.metas.meta_cpl)          : '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [periodo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodo,
        meta_candidatos:   form.meta_candidatos   ? parseInt(form.meta_candidatos)   : null,
        meta_contratacoes: form.meta_contratacoes ? parseInt(form.meta_contratacoes) : null,
        meta_leads:        form.meta_leads        ? parseInt(form.meta_leads)        : null,
        verba_investida:   form.verba_investida   ? parseFloat(form.verba_investida) : null,
        meta_cpl:          form.meta_cpl          ? parseFloat(form.meta_cpl)        : null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      const saved: MetasData = await res.json()
      setData(prev => prev ? { ...prev, metas: saved } : null)
      setSaveMsg({ type: 'ok', text: 'Metas salvas! As barras de progresso foram atualizadas.' })
    } else {
      const body = await res.json().catch(() => ({}))
      setSaveMsg({ type: 'err', text: body.error ?? `Erro ${res.status} ao salvar. Verifique se a tabela dashboard.metas foi criada no Supabase (rodar supabase/create_metas_table.sql).` })
    }
    setTimeout(() => setSaveMsg(null), 6000)
  }

  const r = data?.realizado

  return (
    <div className="flex flex-col gap-5">
      {/* Period selector */}
      <select
        value={periodo}
        onChange={e => setPeriodo(e.target.value)}
        style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
      >
        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Form */}
        <div className="rounded-xl p-6 flex flex-col gap-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}>
            Cadastrar metas
          </h3>
          {saveMsg && (
            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{
                backgroundColor: saveMsg.type === 'ok' ? '#D1FAE5' : '#FEE2E2',
                color: saveMsg.type === 'ok' ? '#065F46' : '#991B1B',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {saveMsg.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {FIELDS.map(({ key, label, type, step }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                  {label}
                </label>
                <input
                  type={type}
                  step={step}
                  min="0"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="—"
                  style={inputStyle}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={saving || loading}
              className="mt-2 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#0A0A0A', color: '#F5F4F2', fontFamily: 'var(--font-dm-sans)' }}
            >
              {saving ? 'Salvando...' : 'Salvar metas'}
            </button>
          </form>
        </div>

        {/* Progress bars */}
        <div className="rounded-xl p-6 flex flex-col gap-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}>
            Progresso
          </h3>
          {loading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: '#F5F4F2' }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <ProgressBar
                label="Candidatos"
                realizado={r?.candidatos ?? 0}
                meta={data?.metas?.meta_candidatos ?? null}
              />
              <ProgressBar
                label="Contratações"
                realizado={r?.contratacoes ?? 0}
                meta={data?.metas?.meta_contratacoes ?? null}
              />
              <ProgressBar
                label="Leads B2B"
                realizado={r?.leads ?? 0}
                meta={data?.metas?.meta_leads ?? null}
              />
              <ProgressBar
                label="CPL realizado"
                realizado={r?.cpl ?? null}
                meta={data?.metas?.meta_cpl ?? null}
                invertido
                prefix="R$ "
              />
              {data?.metas?.verba_investida != null && (
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#E8E7E4' }}>
                  <span className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                    Verba alocada
                  </span>
                  <span className="text-sm font-semibold" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
                    R$ {Number(data.metas.verba_investida).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
