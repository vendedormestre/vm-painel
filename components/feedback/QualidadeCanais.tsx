'use client'

import { useState, useEffect } from 'react'

type CanalRow = {
  canal: string
  leads: number
  contactados: number
  videos: number
  aprovados: number
  contratados: number
  taxa: number
}

export function QualidadeCanais() {
  const [rows, setRows] = useState<CanalRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feedback/qualidade')
      .then(r => r.json())
      .then(d => { setRows(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }} />
  }

  if (rows.length === 0) return null

  const taxas = rows.filter(r => r.leads > 0).map(r => r.taxa)
  const maxTaxa = taxas.length > 0 ? Math.max(...taxas) : -1
  const minTaxa = taxas.length > 1 ? Math.min(...taxas) : -1

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: '#E8E7E4' }}>
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#0A0A0A' }}>
          Qualidade por canal
        </h3>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-xs" style={{ minWidth: 580 }}>
          <thead>
            <tr style={{ backgroundColor: '#F5F4F2', borderBottom: '1px solid #E8E7E4' }}>
              {['Canal', 'Leads', 'Contactados', 'Vídeos', 'Aprovados', 'Contratados', 'Conversão'].map(h => (
                <th
                  key={h}
                  className="text-left px-3 py-2 font-medium uppercase tracking-wider"
                  style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const isBest  = maxTaxa >= 0 && r.taxa === maxTaxa && r.taxa > 0
              const isWorst = minTaxa >= 0 && r.taxa === minTaxa && r.taxa < maxTaxa
              const bg = isBest ? '#F0FDF4' : isWorst ? '#FFF1F2' : undefined
              const convColor = isBest ? '#15803D' : isWorst ? '#B91C1C' : '#0A0A0A'

              return (
                <tr key={r.canal} style={{ borderBottom: '1px solid #F0EFED', backgroundColor: bg }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>{r.canal}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#0A0A0A', fontFamily: 'var(--font-dm-sans)' }}>{r.leads}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{r.contactados}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{r.videos}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{r.aprovados}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>{r.contratados}</td>
                  <td className="px-3 py-2.5 text-center font-semibold" style={{ color: convColor, fontFamily: 'var(--font-dm-sans)' }}>
                    {r.taxa}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
