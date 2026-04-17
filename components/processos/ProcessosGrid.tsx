'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { ProcessoData, ProcessosPeriod } from '@/lib/processos'
import { ProcessoCard } from './ProcessoCard'
import { NovoProcessoModal } from './NovoProcessoModal'
import { ProcessosPeriodFilter } from './ProcessosPeriodFilter'

const VALID_PP: ProcessosPeriod[] = ['mes', '3m', 'all']

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height: 320 }}
        />
      ))}
    </div>
  )
}

export function ProcessosGrid() {
  const searchParams = useSearchParams()
  const rawPp = searchParams.get('pp') ?? '3m'
  const pp: ProcessosPeriod = VALID_PP.includes(rawPp as ProcessosPeriod)
    ? (rawPp as ProcessosPeriod)
    : '3m'

  const [processos, setProcessos] = useState<ProcessoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProcessos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/processos?pp=${pp}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: ProcessoData[] = await res.json()
      setProcessos(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [pp])

  useEffect(() => {
    fetchProcessos()
  }, [fetchProcessos])

  // Group by empresa, preserving sort order
  const empresaOrder: string[] = []
  const byEmpresa: Record<string, ProcessoData[]> = {}
  processos.forEach(p => {
    if (!byEmpresa[p.empresa]) {
      byEmpresa[p.empresa] = []
      empresaOrder.push(p.empresa)
    }
    byEmpresa[p.empresa].push(p)
  })

  const multiEmpresa = empresaOrder.length > 1

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          {loading
            ? 'Carregando...'
            : `${processos.length} grupo${processos.length !== 1 ? 's' : ''} · ${empresaOrder.length} empresa${empresaOrder.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <ProcessosPeriodFilter current={pp} />
          <NovoProcessoModal onCreated={fetchProcessos} />
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
          Erro ao carregar processos: {error}
        </p>
      ) : processos.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#FFFFFF', border: '1px dashed #C8C7C3' }}
        >
          <p className="text-sm mb-1" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
            Nenhum candidato no período selecionado
          </p>
          <p className="text-xs" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
            Tente &ldquo;Todo o período&rdquo; ou verifique os dados em <code>public.aplicacao</code>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {empresaOrder.map(empresa => (
            <div key={empresa} className="flex flex-col gap-3">
              {multiEmpresa && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ backgroundColor: '#E8E7E4' }} />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-2"
                    style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {empresa}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: '#E8E7E4' }} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {byEmpresa[empresa].map(p => (
                  <ProcessoCard
                    key={`${p.empresa}|${p.cargo}`}
                    processo={p}
                    onRefresh={fetchProcessos}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
