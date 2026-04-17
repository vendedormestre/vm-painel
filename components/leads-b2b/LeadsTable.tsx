'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LeadB2B } from '@/lib/leads-b2b'

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo', contactado: 'Contactado', qualificado: 'Qualificado',
  fechado: 'Fechado', descartado: 'Descartado',
}

const STATUS_COLORS: Record<string, string> = {
  novo: '#8A8986', contactado: '#3B82F6', qualificado: '#10B981',
  fechado: '#D4001F', descartado: '#6B7280',
}

const QUICK_ACTIONS = [
  { value: 'contactado', label: 'Contactado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'descartado', label: 'Descartado' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtPhone(p: string | null) {
  return p?.replace(/\D/g, '') || ''
}

export function LeadsTable({ leads }: { leads: LeadB2B[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(email: string, status: string) {
    setUpdating(email)
    try {
      await fetch('/api/feedback/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_email: email, status }),
      })
      router.refresh()
    } finally {
      setUpdating(null)
    }
  }

  if (!leads.length) {
    return (
      <p className="text-sm text-center py-8" style={{ color: '#C8C7C3', fontFamily: 'var(--font-dm-sans)' }}>
        Nenhum lead no período
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #E8E7E4' }}>
      <table className="w-full text-sm min-w-[860px]">
        <thead>
          <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
            {['Nome', 'Empresa', 'Email', 'WhatsApp', 'Data', 'Canal', 'Status', 'Ação rápida'].map(c => (
              <th
                key={c}
                className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => {
            const isUpdating = updating === lead.email
            return (
              <tr
                key={`${lead.email}-${i}`}
                className="transition-colors hover:bg-gray-50"
                style={{ borderBottom: '1px solid #F0EFED' }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>
                  {lead.nome || '—'}
                </td>
                <td className="px-4 py-3" style={{ color: '#4A4A4A', fontFamily: 'var(--font-dm-sans)' }}>
                  {lead.empresa || '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                  {lead.email}
                </td>
                <td className="px-4 py-3">
                  {lead.whatsapp && fmtPhone(lead.whatsapp) ? (
                    <a
                      href={`https://wa.me/${fmtPhone(lead.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                      title={lead.whatsapp}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  ) : (
                    <span style={{ color: '#C8C7C3' }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                  {fmtDate(lead.created_at)}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
                  {lead.utm_source || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[lead.status_atual] ?? '#8A8986'}18`,
                      color: STATUS_COLORS[lead.status_atual] ?? '#8A8986',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    {STATUS_LABELS[lead.status_atual] ?? lead.status_atual}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {QUICK_ACTIONS.map(action => {
                      const active = lead.status_atual === action.value
                      return (
                        <button
                          key={action.value}
                          onClick={() => updateStatus(lead.email, action.value)}
                          disabled={isUpdating || active}
                          className="px-2 py-0.5 rounded text-xs transition-all disabled:cursor-not-allowed"
                          style={{
                            fontFamily: 'var(--font-dm-sans)',
                            backgroundColor: active ? `${STATUS_COLORS[action.value]}18` : '#F5F4F2',
                            color: active ? STATUS_COLORS[action.value] : '#8A8986',
                            border: `1px solid ${active ? STATUS_COLORS[action.value] : '#E8E7E4'}`,
                            opacity: isUpdating && !active ? 0.5 : 1,
                          }}
                        >
                          {action.label}
                        </button>
                      )
                    })}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
