'use client'

import { useState, FormEvent } from 'react'

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

function Field({
  label, id, type = 'text', value, onChange, required,
}: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
        {label}
      </label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} required={required} style={inputStyle} />
    </div>
  )
}

export function NovoProcessoModal({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ cargo: '', empresa: '', vagas_abertas: '', meta_contratacoes: '' })

  function set(key: string) {
    return (v: string) => setForm(f => ({ ...f, [key]: v }))
  }

  function close() {
    setOpen(false)
    setError('')
    setForm({ cargo: '', empresa: '', vagas_abertas: '', meta_contratacoes: '' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/processos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cargo: form.cargo,
        empresa: form.empresa,
        vagas_abertas: form.vagas_abertas ? parseInt(form.vagas_abertas) : null,
        meta_contratacoes: form.meta_contratacoes ? parseInt(form.meta_contratacoes) : null,
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg || 'Erro ao criar processo')
      return
    }

    close()
    onCreated?.()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#D4001F', color: '#F5F4F2', fontFamily: 'var(--font-dm-sans)' }}
      >
        + Novo processo
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,10,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) close() }}
        >
          <div className="w-full max-w-md rounded-xl p-6 flex flex-col gap-5" style={{ backgroundColor: '#FFFFFF' }}>
            <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.125rem', color: '#0A0A0A' }}>
              Novo processo seletivo
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Cargo *" id="cargo" value={form.cargo} onChange={set('cargo')} required />
              <Field label="Empresa *" id="empresa" value={form.empresa} onChange={set('empresa')} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vagas abertas" id="vagas" type="number" value={form.vagas_abertas} onChange={set('vagas_abertas')} />
                <Field label="Meta de contratações" id="meta" type="number" value={form.meta_contratacoes} onChange={set('meta_contratacoes')} />
              </div>

              {error && (
                <p className="text-sm" style={{ color: '#D4001F', fontFamily: 'var(--font-dm-sans)' }}>{error}</p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ border: '1px solid #C8C7C3', fontFamily: 'var(--font-dm-sans)', color: '#0A0A0A', backgroundColor: '#FFFFFF' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-md text-sm disabled:opacity-60"
                  style={{ backgroundColor: '#D4001F', color: '#F5F4F2', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {loading ? 'Criando...' : 'Criar processo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
