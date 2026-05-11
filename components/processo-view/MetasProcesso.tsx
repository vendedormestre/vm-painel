'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProcessoMetasData } from '@/lib/processo-view'

const VALID_FIELDS = ['meta_candidatos', 'meta_cpl', 'meta_videos', 'meta_contratacoes'] as const
type MetaField = (typeof VALID_FIELDS)[number]

function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #FF5500',
  borderRadius: 4,
  padding: '1px 5px',
  fontFamily: 'var(--font-barlow-condensed)',
  fontSize: 12,
  color: '#0D0B0A',
  outline: 'none',
  backgroundColor: '#FFFFFF',
  textAlign: 'right',
}

function EditButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title="Editar meta"
      style={{ color: hovered ? '#8A8986' : '#C8C7C3', lineHeight: 1, padding: 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PencilIcon />
    </button>
  )
}

// ── Card com barra de progresso (Candidatos, Vídeos, Contratações) ──────────

function ProgressCard({
  label,
  realizado,
  meta,
  field,
  onSave,
}: {
  label: string
  realizado: number
  meta: number
  field: MetaField
  onSave: (field: MetaField, value: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(String(meta))
  const inputRef = useRef<HTMLInputElement>(null)

  const pct = meta > 0 ? Math.round((realizado / meta) * 100) : 0
  const achieved = meta > 0 && realizado >= meta

  function startEdit() {
    setEditVal(String(meta))
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  function commit() {
    const val = parseInt(editVal, 10)
    if (!isNaN(val) && val > 0) onSave(field, val)
    setEditing(false)
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: '#F4F3F1', border: '1px solid #E8E7E4' }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
        >
          {label}
        </p>
        <EditButton onClick={startEdit} />
      </div>

      <p
        className="text-3xl font-bold leading-none"
        style={{ color: '#0D0B0A', fontFamily: 'var(--font-barlow-condensed)' }}
      >
        {realizado.toLocaleString('pt-BR')}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E8E7E4' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: achieved ? '#0D0B0A' : '#FF5500',
            }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}>
            {pct}% da meta
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-barlow)' }}>
              meta:
            </span>
            {editing ? (
              <input
                ref={inputRef}
                type="number"
                min="1"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={commit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commit()
                  if (e.key === 'Escape') setEditing(false)
                }}
                style={{ ...inputStyle, width: 56 }}
              />
            ) : (
              <button
                onClick={startEdit}
                className="text-xs font-semibold"
                style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#0D0B0A' }}
              >
                {meta.toLocaleString('pt-BR')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Card CPL com badge colorido ──────────────────────────────────────────────

function CplCard({
  cplHistorico,
  metaCpl,
  onSave,
}: {
  cplHistorico: number | null
  metaCpl: number
  onSave: (field: MetaField, value: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(metaCpl.toFixed(2))
  const inputRef = useRef<HTMLInputElement>(null)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const dentroMeta = cplHistorico !== null && cplHistorico <= metaCpl
  const acimaMeta = cplHistorico !== null && cplHistorico > metaCpl

  const badgeBg = acimaMeta ? '#FEE2E2' : dentroMeta ? '#DCFCE7' : '#E8E7E4'
  const badgeColor = acimaMeta ? '#EF4444' : dentroMeta ? '#22C55E' : '#8A8986'
  const badgeLabel = acimaMeta ? 'Acima da meta' : dentroMeta ? 'Dentro da meta' : 'Sem dados'

  function startEdit() {
    setEditVal(metaCpl.toFixed(2))
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  function commit() {
    const val = parseFloat(editVal)
    if (!isNaN(val) && val > 0) onSave('meta_cpl', val)
    setEditing(false)
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: '#F4F3F1', border: '1px solid #E8E7E4' }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
        >
          CPL
        </p>
        <EditButton onClick={startEdit} />
      </div>

      <p
        className="text-3xl font-bold leading-none"
        style={{ color: '#0D0B0A', fontFamily: 'var(--font-barlow-condensed)' }}
      >
        {cplHistorico !== null ? fmt(cplHistorico) : '—'}
      </p>

      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: badgeBg, color: badgeColor, fontFamily: 'var(--font-barlow)' }}
        >
          {badgeLabel}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-barlow)' }}>
            meta:
          </span>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min="0.01"
              step="0.01"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commit}
              onKeyDown={e => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
              style={{ ...inputStyle, width: 72 }}
            />
          ) : (
            <button
              onClick={startEdit}
              className="text-xs font-semibold"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#0D0B0A' }}
            >
              {fmt(metaCpl)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

type Props = {
  codigoPs: string
  metas: ProcessoMetasData
}

export function MetasProcesso({ codigoPs, metas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState(false)

  async function saveMeta(field: MetaField, value: number) {
    try {
      const res = await fetch('/api/processos/metas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_ps: codigoPs, field, value }),
      })
      if (res.ok) {
        startTransition(() => router.refresh())
        setToast(true)
        setTimeout(() => setToast(false), 2500)
      }
    } catch {
      // fail silently
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between h-5">
        {toast && (
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{ backgroundColor: '#0D0B0A', color: '#F4F3F1', fontFamily: 'var(--font-barlow)' }}
          >
            Meta atualizada
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s' }}
      >
        <ProgressCard
          label="Candidatos"
          realizado={metas.total_candidatos}
          meta={metas.meta_candidatos}
          field="meta_candidatos"
          onSave={saveMeta}
        />
        <CplCard
          cplHistorico={metas.cpl_historico}
          metaCpl={metas.meta_cpl}
          onSave={saveMeta}
        />
        <ProgressCard
          label="Vídeos recebidos"
          realizado={metas.total_videos}
          meta={metas.meta_videos}
          field="meta_videos"
          onSave={saveMeta}
        />
        <ProgressCard
          label="Contratações"
          realizado={metas.total_contratados}
          meta={metas.meta_contratacoes}
          field="meta_contratacoes"
          onSave={saveMeta}
        />
      </div>
    </div>
  )
}
