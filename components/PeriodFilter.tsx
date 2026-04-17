'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const PERIODS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'mes', label: 'Este mês' },
]

export function PeriodFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') || 'mes'

  function setPeriod(period: string) {
    const params = new URLSearchParams(searchParams)
    params.set('period', period)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {PERIODS.map(p => {
        const active = current === p.value
        return (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className="px-4 py-2 rounded-md text-sm transition-all"
            style={{
              backgroundColor: active ? '#0A0A0A' : '#FFFFFF',
              color: active ? '#F5F4F2' : '#0A0A0A',
              border: `1px solid ${active ? '#0A0A0A' : '#C8C7C3'}`,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
