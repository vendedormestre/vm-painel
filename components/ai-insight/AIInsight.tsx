'use client'

import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'vm_ai_insight'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

type CacheEntry = { insight: string; generatedAt: string }

function loadCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - new Date(entry.generatedAt).getTime() > CACHE_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function saveCache(entry: CacheEntry) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)) } catch { /* noop */ }
}

function fmtTimestamp(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function LoadingDots() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(id)
  }, [])
  return <span>{dots}</span>
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

export function AIInsight() {
  const [insight, setInsight] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  // On mount, load from cache
  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setInsight(cached.insight)
      setGeneratedAt(cached.generatedAt)
      setFromCache(true)
    }
  }, [])

  const fetchInsight = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadCache()
      if (cached) {
        setInsight(cached.insight)
        setGeneratedAt(cached.generatedAt)
        setFromCache(true)
        return
      }
    }
    setLoading(true)
    setError(null)
    setFromCache(false)
    try {
      const res = await fetch('/api/ai-insight')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Erro ${res.status}`)
      }
      const data = await res.json()
      setInsight(data.insight)
      setGeneratedAt(data.generatedAt)
      saveCache({ insight: data.insight, generatedAt: data.generatedAt })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Parse numbered paragraphs (1. ... 2. ... 3. ...)
  function parseParagraphs(text: string): string[] {
    // Split on lines starting with a number + dot
    const parts = text.split(/(?=\d+\.\s)/).filter(Boolean)
    return parts.length >= 2 ? parts : [text]
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-5"
      style={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3
          className="text-base font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: '#D4001F', letterSpacing: '0.01em' }}
        >
          Análise do período
        </h3>
        <button
          onClick={() => fetchInsight(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: '#1A1A1A',
            color: '#F5F4F2',
            fontFamily: 'var(--font-dm-sans)',
            border: '1px solid #2A2A2A',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshIcon />
          {loading ? 'Analisando...' : 'Atualizar análise'}
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            Analisando dados<LoadingDots />
          </p>
          {[60, 80, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded animate-pulse"
              style={{ backgroundColor: '#1A1A1A', width: `${w}%` }}
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm" style={{ color: '#EF4444', fontFamily: 'var(--font-dm-sans)' }}>
          {error}
        </p>
      ) : insight ? (
        <div className="flex flex-col gap-4">
          {parseParagraphs(insight).map((para, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed"
              style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}
            >
              {para.trim()}
            </p>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
            Clique em &ldquo;Atualizar análise&rdquo; para gerar o resumo executivo do período atual com IA.
          </p>
          <button
            onClick={() => fetchInsight(true)}
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              backgroundColor: '#D4001F',
              color: '#FFFFFF',
              fontFamily: 'var(--font-dm-sans)',
              cursor: 'pointer',
            }}
          >
            Gerar análise
          </button>
        </div>
      )}

      {/* Footer */}
      {generatedAt && !loading && (
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#1A1A1A' }}>
          <p className="text-xs" style={{ color: '#4A4A4A', fontFamily: 'var(--font-dm-sans)' }}>
            Atualizado em {fmtTimestamp(generatedAt)}
            {fromCache && ' · em cache'}
          </p>
        </div>
      )}
    </div>
  )
}
